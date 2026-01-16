"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommandPrompt = buildCommandPrompt;
exports.buildFixPrompt = buildFixPrompt;
function buildCommandPrompt(userInput, os) {
    return `
你是一个专业的命令行专家。

【系统环境】
- 操作系统: ${os.name}
- Shell: ${os.shell}
- find 实现: ${os.find}
- stat 实现: ${os.stat}

【规则】
- 命令必须与当前系统兼容。
- 如果是 macOS (BSD):
  - 不允许使用 find -printf
  - 优先使用 stat -f
- 如果是 Linux (GNU):
  - 可使用 find -printf
- 默认不使用 sudo。
- 确保输出的命令是单行或者使用 && 连接。
- 不要解释，只输出符合以下 JSON 结构的文本。

【输出 JSON 结构】
{
  "plan": "简要说明你准备执行的步骤",
  "command": "可直接执行的 shell 命令",
  "risk": "low | medium | high"
}

【用户需求】
${userInput}
`;
}
function buildFixPrompt(originalCmd, stderr, os) {
    return `
该命令在 ${os.name} 上执行失败：

命令：
${originalCmd}

错误信息：
${stderr}

请生成一个 **${os.name} 兼容** 的等价命令。
依然只输出 JSON 格式。
{
  "plan": "修复说明",
  "command": "修复后的命令",
  "risk": "low | medium | high"
}
`;
}
//# sourceMappingURL=prompt.js.map