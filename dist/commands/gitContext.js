"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitContext = getGitContext;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function run(cmd) {
    try {
        const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 });
        return stdout.trim() || null;
    }
    catch {
        return null;
    }
}
async function getGitContext() {
    const staged = await run('git diff --staged');
    const unstaged = await run('git diff');
    if (!staged && !unstaged)
        return null;
    let result = `以下是 Git 变更内容：\n`;
    if (staged) {
        result += `\n【已暂存】\n\`\`\`diff\n${staged}\n\`\`\`\n`;
    }
    if (unstaged) {
        result += `\n【未暂存】\n\`\`\`diff\n${unstaged}\n\`\`\`\n`;
    }
    return result;
}
//# sourceMappingURL=gitContext.js.map