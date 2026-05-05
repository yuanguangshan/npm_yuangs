import { Policy, PolicyContext, PolicyResult } from '../types';
import { ShellCmdPayload } from '../../state';
import { DANGEROUS_SHELL_PATTERNS } from './dangerousShellPatterns';

export class NoDangerousShellPolicy implements Policy {
  name = 'no-dangerous-shell';
  description = 'Prevents execution of dangerous shell commands';

  evaluate(context: PolicyContext): PolicyResult {
    const { action } = context;

    if (action.type === 'shell_cmd') {
      const command = (action.payload as unknown as ShellCmdPayload).command || '';

      for (const { pattern, name, risk } of DANGEROUS_SHELL_PATTERNS) {
        if (pattern.test(command)) {
          return {
            allowed: false,
            reason: `Dangerous command detected: ${name} (${risk} risk)`,
            requiresEscalation: risk === 'high',
            suggestedActions: [
              `Review the command: "${command}"`,
              'Consider using safer alternatives',
              'Break down the operation into smaller, safer steps'
            ]
          };
        }
      }
    }

    return {
      allowed: true,
      reason: 'No dangerous patterns detected'
    };
  }
}

export const noDangerousShellPolicy = new NoDangerousShellPolicy();
