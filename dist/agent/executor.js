"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutor = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ToolExecutor {
    static async execute(action) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message || String(error),
                output: ''
            };
        }
    }
    static async executeTool(payload) {
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
    static async toolReadFile(params) {
        const filePath = params.path;
        try {
            const content = await promises_1.default.readFile(filePath, 'utf-8');
            return {
                success: true,
                output: content,
                artifacts: [filePath]
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                output: ''
            };
        }
    }
    static async toolWriteFile(params) {
        const filePath = params.path;
        const content = params.content;
        try {
            await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
            await promises_1.default.writeFile(filePath, content, 'utf-8');
            return {
                success: true,
                output: `Successfully wrote ${filePath}`,
                artifacts: [filePath]
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                output: ''
            };
        }
    }
    static async toolListFiles(params) {
        const dirPath = params.path || '.';
        const recursive = params.recursive || false;
        try {
            const files = await this.getFiles(dirPath, recursive);
            return {
                success: true,
                output: JSON.stringify(files, null, 2),
                artifacts: files.map(f => f.path)
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                output: ''
            };
        }
    }
    static async getFiles(dir, recursive) {
        const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const fullPath = path_1.default.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push({ path: fullPath, type: 'directory' });
                if (recursive) {
                    const subFiles = await this.getFiles(fullPath, recursive);
                    files.push(...subFiles);
                }
            }
            else {
                files.push({ path: fullPath, type: 'file' });
            }
        }
        return files;
    }
    static async executeShell(command) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                output: error.stdout || error.stderr || ''
            };
        }
    }
    static async executeDiff(diff) {
        try {
            const tempFile = path_1.default.join(process.cwd(), '.yuangs_temp.patch');
            await promises_1.default.writeFile(tempFile, diff, 'utf-8');
            const { stdout, stderr } = await execAsync(`git apply --check ${tempFile}`, {
                cwd: process.cwd()
            });
            const { stdout: applyOutput } = await execAsync(`git apply ${tempFile}`, {
                cwd: process.cwd()
            });
            await promises_1.default.unlink(tempFile);
            return {
                success: true,
                output: applyOutput || 'Diff applied successfully',
                artifacts: ['.yuangs_temp.patch']
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                output: error.stdout || error.stderr || 'Failed to apply diff'
            };
        }
    }
}
exports.ToolExecutor = ToolExecutor;
//# sourceMappingURL=executor.js.map