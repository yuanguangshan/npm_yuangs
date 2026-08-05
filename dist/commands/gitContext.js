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
    // 截断过长的 diff，避免 prompt 暴涨（模型可用 git diff 工具查看完整内容）
    const MAX_DIFF_CHARS = 4000;
    const truncate = (diff) => diff.length > MAX_DIFF_CHARS
        ? diff.slice(0, MAX_DIFF_CHARS) + `\n\n...(已截断，共 ${diff.length} 字符；用 git diff 查看完整内容)`
        : diff;
    let result = `以下是 Git 变更内容：\n`;
    if (staged) {
        result += `\n【已暂存】\n\`\`\`diff\n${truncate(staged)}\n\`\`\`\n`;
    }
    if (unstaged) {
        result += `\n【未暂存】\n\`\`\`diff\n${truncate(unstaged)}\n\`\`\`\n`;
    }
    return result;
}
//# sourceMappingURL=gitContext.js.map