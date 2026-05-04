import { Policy, PolicyContext, PolicyResult } from '../types';
import { ToolCallPayload, ShellCmdPayload } from '../../state';
import path from 'path';

/**
 * Prevents write/append operations outside the current working directory.
 * Enforces workspace boundary for file modifications.
 */
export class WorkdirWritePolicy implements Policy {
  name = 'workdir-write-boundary';
  description = 'Prevents write operations outside the current working directory';

  evaluate(context: PolicyContext): PolicyResult {
    const { action, cwd } = context;

    if (action.type === 'tool_call') {
      const payload = action.payload as unknown as ToolCallPayload;
      const writeTools = ['write_file', 'append_file', 'code_diff'];
      if (!writeTools.includes(payload.tool_name)) {
        return { allowed: true, reason: 'Not a write tool' };
      }

      const filePath = (payload.parameters as Record<string, unknown>)?.path as string;
      if (!filePath) {
        return { allowed: true, reason: 'No path specified' };
      }

      const resolvedPath = path.resolve(filePath);
      const resolvedCwd = path.resolve(cwd);

      if (!resolvedPath.startsWith(resolvedCwd)) {
        return {
          allowed: false,
          reason: `Write target "${filePath}" is outside working directory "${cwd}"`,
          requiresEscalation: true,
          suggestedActions: [
            `Move the target file into the working directory`,
            `Change working directory to include the target path`
          ]
        };
      }
    }

    if (action.type === 'shell_cmd') {
      const payload = action.payload as unknown as ShellCmdPayload;
      const cmd = payload.command || '';

      // Detect redirects to paths outside cwd
      const redirectMatch = cmd.match(/>\s*(\/[^&>\s]+)/);
      if (redirectMatch) {
        const targetPath = redirectMatch[1];
        const resolvedTarget = path.resolve(targetPath);
        const resolvedCwd = path.resolve(cwd);

        if (!resolvedTarget.startsWith(resolvedCwd)) {
          return {
            allowed: false,
            reason: `Shell redirect targets "${targetPath}" outside working directory`,
            requiresEscalation: true,
            suggestedActions: ['Use relative paths within the working directory']
          };
        }
      }
    }

    return { allowed: true, reason: 'Write target is within working directory' };
  }
}

export const workdirWritePolicy = new WorkdirWritePolicy();
