"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Capabilities = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * [Action 2] 硬限制：手指数得过来的 Capability
 */
class Capabilities {
    static async execute(proposal) {
        const { type, payload } = proposal;
        switch (type) {
            case 'SHELL':
                const { stdout, stderr } = await execAsync(payload.cmd);
                return stdout || stderr;
            case 'FILESYSTEM':
                if (payload.content) {
                    await promises_1.default.writeFile(payload.path, payload.content);
                    return `Saved ${payload.path}`;
                }
                return await promises_1.default.readFile(payload.path, 'utf-8');
            case 'PROJECT':
                // 专项支持 NPM 项目逻辑
                const { stdout: npmOut } = await execAsync(payload.cmd);
                return npmOut;
            case 'KNOWLEDGE':
                return `Simulation: Answer found for ${payload.query}`;
            default:
                throw new Error(`Unknown capability: ${type}`);
        }
    }
}
exports.Capabilities = Capabilities;
//# sourceMappingURL=Capabilities.js.map