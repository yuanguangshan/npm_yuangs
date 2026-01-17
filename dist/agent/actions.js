"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAction = executeAction;
const child_process_1 = require("child_process");
const util_1 = require("util");
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = __importDefault(require("readline"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function executeAction(action, options) {
    if (action.type === 'print') {
        console.log(action.content);
        return;
    }
    if (action.type === 'confirm') {
        const ok = options?.autoYes || await confirm('Execute this action?');
        if (ok) {
            await executeAction(action.next, options);
        }
        return;
    }
    if (action.type === 'execute') {
        try {
            console.log(chalk_1.default.cyan(`\nExecuting: ${action.command}\n`));
            const { stdout, stderr } = await execAsync(action.command, {
                shell: typeof process.env.SHELL === 'string' ? process.env.SHELL : undefined
            });
            if (stdout)
                console.log(stdout);
            if (stderr)
                console.error(chalk_1.default.yellow(stderr));
        }
        catch (error) {
            console.error(chalk_1.default.red(`Execution failed: ${error.message}`));
            throw error;
        }
    }
}
async function confirm(message) {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(chalk_1.default.cyan(`${message} (y/N): `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}
//# sourceMappingURL=actions.js.map