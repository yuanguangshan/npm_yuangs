import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { ProposedAction, ToolExecutionResult } from './state';

const execAsync = promisify(exec);

export class ToolExecutor {
  static async execute(action: ProposedAction): Promise<ToolExecutionResult> {
    const { type, payload } = action;

    try {
      switch (type) {
        case 'tool_call':
          return await this.executeTool(payload);
        
        case 'shell_cmd':
          return await this.executeShell(payload.command);
        
        case 'code_diff':
          return await this.executeDiff(payload.diff);
        
        case 'answer':
          return {
            success: true,
            output: payload.content || '',
            artifacts: []
          };
        
        default:
          return {
            success: false,
            error: `Unknown action type: ${type}`,
            output: ''
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
        output: ''
      };
    }
  }

  private static async executeTool(payload: any): Promise<ToolExecutionResult> {
    const toolName = payload.tool_name;

    switch (toolName) {
      case 'read_file':
        return await this.toolReadFile(payload.parameters);
      
      case 'write_file':
        return await this.toolWriteFile(payload.parameters);
      
      case 'list_files':
        return await this.toolListFiles(payload.parameters);
      
      case 'web_search':
        return {
          success: false,
          error: 'web_search not implemented yet',
          output: ''
        };
      
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          output: ''
        };
    }
  }

  private static async toolReadFile(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        output: content,
        artifacts: [filePath]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  private static async toolWriteFile(params: any): Promise<ToolExecutionResult> {
    const filePath = params.path;
    const content = params.content;
    
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return {
        success: true,
        output: `Successfully wrote ${filePath}`,
        artifacts: [filePath]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  private static async toolListFiles(params: any): Promise<ToolExecutionResult> {
    const dirPath = params.path || '.';
    const recursive = params.recursive || false;
    
    try {
      const files = await this.getFiles(dirPath, recursive);
      return {
        success: true,
        output: JSON.stringify(files, null, 2),
        artifacts: files.map(f => f.path)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  private static async getFiles(dir: string, recursive: boolean): Promise<Array<{ path: string; type: string }>> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: Array<{ path: string; type: string }> = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push({ path: fullPath, type: 'directory' });
        if (recursive) {
          const subFiles = await this.getFiles(fullPath, recursive);
          files.push(...subFiles);
        }
      } else {
        files.push({ path: fullPath, type: 'file' });
      }
    }

    return files;
  }

  private static async executeShell(command: string): Promise<ToolExecutionResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      const output = stdout || stderr || '';
      
      return {
        success: true,
        output,
        artifacts: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  }

  private static async executeDiff(diff: string): Promise<ToolExecutionResult> {
    try {
      const tempFile = path.join(process.cwd(), '.yuangs_temp.patch');
      await fs.writeFile(tempFile, diff, 'utf-8');

      const { stdout, stderr } = await execAsync(`git apply --check ${tempFile}`, {
        cwd: process.cwd()
      });

      const { stdout: applyOutput } = await execAsync(`git apply ${tempFile}`, {
        cwd: process.cwd()
      });

      await fs.unlink(tempFile);

      return {
        success: true,
        output: applyOutput || 'Diff applied successfully',
        artifacts: ['.yuangs_temp.patch']
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || 'Failed to apply diff'
      };
    }
  }
}
