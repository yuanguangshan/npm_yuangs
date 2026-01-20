"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutor = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ToolExecutor {
    static async execute(action) {
        const { type, payload } = action;
        try {
            switch (type) {
                case 'shell_cmd':
                    const { stdout, stderr } = await execAsync(payload.command);
                    return { success: true, output: stdout || stderr };
                case 'read_file':
                    const content = await promises_1.default.readFile(payload.path, 'utf-8');
                    return { success: true, output: content };
                case 'write_file':
                    await promises_1.default.writeFile(payload.path, payload.content);
                    return { success: true, output: `Successfully wrote ${payload.path}` };
                default:
                    return { success: false, error: `Unknown capability: ${type}` };
            }
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
}
exports.ToolExecutor = ToolExecutor;
//# sourceMappingURL=executor.js.map