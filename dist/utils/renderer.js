"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamMarkdownRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const marked = __importStar(require("marked"));
const marked_terminal_1 = __importDefault(require("marked-terminal"));
// 自定义 TerminalRenderer 配置，设置不同 Markdown 元素的颜色
const customRenderer = new marked_terminal_1.default({
    tab: 2,
    width: process.stdout.columns || 80,
    showSectionPrefix: false,
    // 自定义标题颜色
    heading: (text, level) => {
        switch (level) {
            case 1:
                return chalk_1.default.bold.hex('#FF6B6B')(text); // 一级标题：红色
            case 2:
                return chalk_1.default.bold.hex('#4ECDC4')(text); // 二级标题：青色
            case 3:
                return chalk_1.default.bold.hex('#45B7D1')(text); // 三级标题：蓝色
            case 4:
                return chalk_1.default.bold.hex('#96CEB4')(text); // 四级标题：绿色
            case 5:
                return chalk_1.default.bold.hex('#FFEAA7')(text); // 五级标题：黄色
            case 6:
                return chalk_1.default.bold.hex('#DDA0DD')(text); // 六级标题：紫色
            default:
                return chalk_1.default.bold.hex('#4ECDC4')(text); // 默认标题：青色
        }
    },
    // 自定义加粗文本颜色
    strong: (text) => {
        return chalk_1.default.hex('#F06560')(text); // 加粗文本：橙红色
    },
    // 自定义强调文本颜色
    em: (text) => {
        return chalk_1.default.italic.hex('#C7B8EA')(text); // 斜体文本：淡紫色
    },
    // 自定义代码块样式
    code: (text, lang, escaped) => {
        return chalk_1.default.bgHex('#2D3748').hex('#CBD5E0')(text);
    },
    // 自定义行内代码样式
    codespan: (text) => {
        return chalk_1.default.bgHex('#4A5568').hex('#E2E8F0')(text);
    },
    // 自定义链接样式
    link: (href, title, text) => {
        return chalk_1.default.underline.hex('#63B3ED')(text);
    },
    // 自定义引用样式
    blockquote: (text) => {
        return chalk_1.default.hex('#A0AEC0')(text);
    }
});
// 初始化 marked 配置
if (typeof marked.use === 'function') {
    marked.use({
        renderer: customRenderer
    });
}
else {
    marked.setOptions({
        renderer: customRenderer
    });
}
class StreamMarkdownRenderer {
    fullResponse = '';
    prefix;
    isFirstOutput = true;
    spinner = null;
    startTime;
    quietMode;
    autoFinish;
    onChunkCallback;
    constructor(prefix = chalk_1.default.bold.blue('🤖 AI：'), spinner, options) {
        this.prefix = prefix;
        this.spinner = spinner || null;
        this.startTime = Date.now();
        // Support both old boolean quietMode and new options object
        if (typeof options === 'boolean') {
            this.quietMode = options;
            this.autoFinish = false;
            this.onChunkCallback = null;
        }
        else {
            this.quietMode = options?.quietMode ?? false;
            this.autoFinish = options?.autoFinish ?? false;
            this.onChunkCallback = options?.onChunkCallback || null;
        }
    }
    /**
     * 处理流式数据块
     */
    onChunk(chunk) {
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.stop();
        }
        if (!this.quietMode) {
            if (this.isFirstOutput) {
                process.stdout.write(this.prefix);
                this.isFirstOutput = false;
            }
            process.stdout.write(chunk);
        }
        this.fullResponse += chunk;
        // Call external callback if provided
        if (this.onChunkCallback) {
            this.onChunkCallback(chunk);
        }
    }
    /**
     * 流结束，执行回滚并渲染 Markdown
     */
    finish() {
        // 如果 Spinner 还在转（说明没有任何输出），先停掉
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.stop();
        }
        const formatted = marked.parse(this.fullResponse, { async: false }).trim();
        if (this.quietMode) {
            if (this.fullResponse.trim()) {
                process.stdout.write(this.prefix + formatted + '\n');
            }
        }
        else if (process.stdout.isTTY && this.fullResponse.trim()) {
            const screenWidth = process.stdout.columns || 80;
            const totalContent = this.prefix + this.fullResponse;
            // 计算原始文本占用的可视行数
            const lineCount = this.getVisualLineCount(totalContent, screenWidth);
            // 1. 清除当前行剩余内容
            process.stdout.write('\r\x1b[K');
            // 2. 向上回滚并清除之前的行
            for (let i = 0; i < lineCount - 1; i++) {
                process.stdout.write('\x1b[A\x1b[K');
            }
            // 3. 输出格式化后的 Markdown
            process.stdout.write(this.prefix + formatted + '\n');
        }
        else {
            // 非 TTY 模式或无内容，直接补充换行（如果之前输出了内容）
            if (this.fullResponse.trim()) {
                process.stdout.write('\n');
            }
        }
        const elapsed = (Date.now() - this.startTime) / 1000;
        const separator = '─'.repeat(20);
        process.stdout.write(`\n${chalk_1.default.gray(separator)} (耗时: ${elapsed.toFixed(2)}s) ${separator}\n\n`);
        return this.fullResponse;
    }
    /**
     * 计算文本在终端的可视行数
     */
    getVisualLineCount(text, screenWidth) {
        const stripAnsi = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        const lines = text.split('\n');
        let totalLines = 0;
        for (const line of lines) {
            // Expand tabs
            const expandedLine = line.replace(/\t/g, '        ');
            const cleanLine = stripAnsi(expandedLine);
            let lineWidth = 0;
            for (const char of cleanLine) {
                const code = char.codePointAt(0) || 0;
                // 大部分宽字符（如中文）占 2 格
                lineWidth += code > 255 ? 2 : 1;
            }
            if (lineWidth === 0) {
                totalLines += 1;
            }
            else {
                totalLines += Math.ceil(lineWidth / screenWidth);
            }
        }
        return totalLines;
    }
    /**
     * Start chunking mode for Agent Runtime
     * Returns a callback function that Agent can use to send chunks
     */
    startChunking() {
        return (chunk) => {
            this.onChunk(chunk);
            // Auto-finish if configured
            if (this.autoFinish && this.isComplete()) {
                this.finish();
            }
        };
    }
    /**
     * Check if response appears complete (heuristic)
     */
    isComplete() {
        const trimmed = this.fullResponse.trim();
        // Simple heuristic: ends with code block or natural sentence end
        return trimmed.endsWith('```') ||
            trimmed.endsWith('.') ||
            (trimmed.length > 50 && trimmed.endsWith('\n'));
    }
}
exports.StreamMarkdownRenderer = StreamMarkdownRenderer;
//# sourceMappingURL=renderer.js.map