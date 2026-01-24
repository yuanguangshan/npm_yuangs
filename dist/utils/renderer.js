"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamMarkdownRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const markdown_it_1 = __importDefault(require("markdown-it"));
/**
 * 终端 Markdown 原生渲染器
 *
 * 核心思想：
 * - 直接使用 markdown-it 的 md.parse() 解析为 Tokens
 * - 遍历 Tokens 并直接映射为 ANSI 样式
 * - 无需 HTML 中转，性能最优
 *
 * 这是 ChatGPT CLI / Warp / Claude CLI 的做法
 */
// 定义终端样式配置
const STYLES = {
    h1: (t) => chalk_1.default.bold.hex('#FF6B6B')(`# ${t}`),
    h2: (t) => chalk_1.default.bold.hex('#4ECDC4')(`## ${t}`),
    h3: (t) => chalk_1.default.bold.hex('#45B7D1')(`### ${t}`),
    h4: (t) => chalk_1.default.bold.hex('#96E6A1')(`#### ${t}`),
    h5: (t) => chalk_1.default.bold.hex('#DDA0DD')(`##### ${t}`),
    h6: (t) => chalk_1.default.bold.hex('#87CEEB')(`###### ${t}`),
    code: (t) => chalk_1.default.bgHex('#2D3748').hex('#CBD5E0')(` ${t} `),
    code_block: (t) => chalk_1.default.gray('│ ') + chalk_1.default.yellowBright(t),
    bold: (t) => chalk_1.default.hex('#F06560')(t),
    italic: (t) => chalk_1.default.italic.hex('#C7B8EA')(t),
    link: (t) => chalk_1.default.underline.hex('#63B3ED')(t),
    list_item: (t) => `  ${chalk_1.default.yellow('•')} ${t}`,
    ordered_item: (t, index) => `  ${chalk_1.default.cyan(`${index}.`)} ${t}`,
    blockquote: (t) => chalk_1.default.hex('#A0AEC0')(`> ${t}`),
};
class StreamMarkdownRenderer {
    md;
    prefix;
    buffer = '';
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
        // 初始化 markdown-it（禁用 HTML）
        this.md = new markdown_it_1.default({
            html: false,
            xhtmlOut: false,
            breaks: true,
            langPrefix: 'language-',
            linkify: true,
            typographer: true,
            quotes: '""\'\''
        });
    }
    /**
     * 处理流式 chunk
     *
     * 策略：
     * 1. 累积到 buffer
     * 2. 实时输出纯文本（不解析 Markdown）
     * 3. finish() 时重新渲染完整内容
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
            // 实时输出纯文本
            process.stdout.write(chunk);
        }
        this.buffer += chunk;
        // Call external callback if provided
        if (this.onChunkCallback) {
            this.onChunkCallback(chunk);
        }
    }
    /**
     * 流结束，渲染完整 Markdown
     *
     * 使用 md.parse() 解析 Tokens，直接映射为 ANSI
     */
    finish() {
        console.error(`[DEBUG Renderer] finish() called, buffer length: ${this.buffer.length}, quietMode: ${this.quietMode}`);
        console.error(`[DEBUG Renderer] buffer content: ${this.buffer.substring(0, 100)}...`);
        // 如果 Spinner 还在转（说明没有任何输出），先停掉
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.stop();
        }
        // 使用 Token 遍历渲染
        const rendered = this.render(this.buffer);
        console.error(`[DEBUG Renderer] rendered length: ${rendered.length}, content: ${rendered.substring(0, 100)}...`);
        if (this.quietMode) {
            if (this.buffer.trim()) {
                process.stdout.write(this.prefix + rendered + '\n');
            }
        }
        else if (this.buffer.trim()) {
            if (process.stdout.isTTY) {
                // TTY 模式：回滚并渲染格式化内容
                const screenWidth = process.stdout.columns || 80;
                const totalContent = this.prefix + this.buffer;
                // 计算原始文本占用的可视行数
                const lineCount = this.getVisualLineCount(totalContent, screenWidth);
                // 1. 清除当前行剩余内容
                process.stdout.write('\r\x1b[K');
                // 2. 向上回滚并清除之前的行
                for (let i = 0; i < lineCount - 1; i++) {
                    process.stdout.write('\x1b[A\x1b[K');
                }
                // 3. 输出格式化后的 Markdown
                process.stdout.write(this.prefix + rendered + '\n');
            }
            else {
                // 非 TTY 模式（如管道）：输出格式化内容，不回滚
                process.stdout.write(this.prefix + rendered + '\n');
            }
        }
        const elapsed = (Date.now() - this.startTime) / 1000;
        const separator = '─'.repeat(20);
        process.stdout.write(`\n${chalk_1.default.gray(separator)} (耗时: ${elapsed.toFixed(2)}s) ${separator}\n\n`);
        return this.buffer;
    }
    /**
     * 使用 markdown-it 的 Token 渲染 Markdown
     *
     * 这是核心函数：Token -> ANSI 直接映射
     */
    render(markdown) {
        const tokens = this.md.parse(markdown, {});
        return this.traverse(tokens);
    }
    /**
     * 遍历 Tokens 并转换为 ANSI
     */
    traverse(tokens) {
        let output = '';
        let i = 0;
        let orderedListIndex = 1;
        let tableData = [];
        let currentRow = [];
        let inTable = false;
        while (i < tokens.length) {
            const token = tokens[i];
            // 处理表格
            if (token.type === 'table_open') {
                inTable = true;
                tableData = [];
                i += 1;
                continue;
            }
            if (token.type === 'table_close') {
                inTable = false;
                if (tableData.length > 0) {
                    output += this.renderTable(tableData) + '\n\n';
                }
                tableData = [];
                i += 1;
                continue;
            }
            if (inTable) {
                // 收集表格单元格内容
                if (token.type === 'tr_open') {
                    currentRow = [];
                    i += 1;
                    continue;
                }
                if (token.type === 'tr_close') {
                    if (currentRow.length > 0) {
                        tableData.push([...currentRow]);
                    }
                    currentRow = [];
                    i += 1;
                    continue;
                }
                if (token.type === 'th_open' || token.type === 'td_open') {
                    const inlineToken = tokens[i + 1];
                    if (inlineToken?.type === 'inline') {
                        const content = this.renderInline(inlineToken.children || []);
                        currentRow.push(content);
                    }
                    i += 3; // 跳过 inline 和 close
                    continue;
                }
            }
            // 处理标题
            if (token.type === 'heading_open') {
                const level = token.tag;
                // 查找 inline token
                const inlineToken = tokens[i + 1];
                const content = inlineToken?.type === 'inline'
                    ? this.renderInline(inlineToken.children || [])
                    : '';
                output += (STYLES[level] || STYLES.h6)(content) + '\n\n';
                i += 3; // 跳过 inline 和 close token
                continue;
            }
            // 处理段落
            if (token.type === 'paragraph_open') {
                // 查找 inline token
                const inlineToken = tokens[i + 1];
                if (inlineToken?.type === 'inline') {
                    output += this.renderInline(inlineToken.children || []) + '\n\n';
                }
                i += 3; // 跳过 inline 和 close token
                continue;
            }
            // 处理代码块
            if (token.type === 'fence') {
                const code = token.content.trim();
                const lines = code.split('\n').map((l) => STYLES.code_block(l));
                output += chalk_1.default.gray('╭' + '─'.repeat(30)) + '\n';
                output += lines.join('\n') + '\n';
                output += chalk_1.default.gray('╰' + '─'.repeat(30)) + '\n\n';
                i += 1;
                continue;
            }
            if (token.type === 'code_block') {
                const code = token.content.trim();
                const lines = code.split('\n').map((l) => STYLES.code_block(l));
                output += lines.join('\n') + '\n\n';
                i += 1;
                continue;
            }
            // 处理无序列表
            if (token.type === 'bullet_list_open') {
                i += 1;
                continue;
            }
            if (token.type === 'bullet_list_close') {
                output += '\n';
                i += 1;
                continue;
            }
            if (token.type === 'list_item_open') {
                // list_item 可能包含多个 token，我们需要收集所有文本
                let content = '';
                let j = i + 1;
                let depth = 1;
                while (j < tokens.length && depth > 0) {
                    const t = tokens[j];
                    if (t.type === 'list_item_open')
                        depth++;
                    if (t.type === 'list_item_close')
                        depth--;
                    if (depth === 1 && t.type === 'inline') {
                        content += this.renderInline(t.children || []) + ' ';
                    }
                    j++;
                }
                output += STYLES.list_item(content.trim()) + '\n';
                i = j;
                continue;
            }
            // 处理有序列表
            if (token.type === 'ordered_list_open') {
                i += 1;
                continue;
            }
            if (token.type === 'ordered_list_close') {
                output += '\n';
                orderedListIndex = 1;
                i += 1;
                continue;
            }
            // 有序列表的 list_item_open
            if (token.type === 'list_item_open' && i > 0 && tokens[i - 1]?.type === 'ordered_list_open') {
                let content = '';
                let j = i + 1;
                let depth = 1;
                while (j < tokens.length && depth > 0) {
                    const t = tokens[j];
                    if (t.type === 'list_item_open')
                        depth++;
                    if (t.type === 'list_item_close')
                        depth--;
                    if (depth === 1 && t.type === 'inline') {
                        content += this.renderInline(t.children || []) + ' ';
                    }
                    j++;
                }
                output += STYLES.ordered_item(content.trim(), orderedListIndex++) + '\n';
                i = j;
                continue;
            }
            // 处理引用块
            if (token.type === 'blockquote_open') {
                let content = '';
                let j = i + 1;
                let depth = 1;
                while (j < tokens.length && depth > 0) {
                    const t = tokens[j];
                    if (t.type === 'blockquote_open')
                        depth++;
                    if (t.type === 'blockquote_close')
                        depth--;
                    if (depth === 1 && t.type === 'inline') {
                        content += this.renderInline(t.children || []) + ' ';
                    }
                    else if (depth === 1 && t.type === 'softbreak') {
                        content += '\n> ';
                    }
                    j++;
                }
                output += STYLES.blockquote(content.trim()) + '\n\n';
                i = j;
                continue;
            }
            // 处理水平线
            if (token.type === 'hr') {
                output += chalk_1.default.gray('─'.repeat(40)) + '\n\n';
                i += 1;
                continue;
            }
            // 处理硬换行和软换行
            if (token.type === 'hardbreak' || token.type === 'softbreak') {
                output += '\n';
                i += 1;
                continue;
            }
            // 跳过其他 token
            i += 1;
        }
        return output.trim();
    }
    /**
     * 提取 inline token 的文本内容
     */
    extractInlineText(tokens, index) {
        const token = tokens[index];
        if (!token || token.type !== 'inline') {
            return '';
        }
        return this.renderInline(token.children || []);
    }
    /**
     * 渲染内联样式
     *
     * 这是最关键的部分：加粗、斜体、内联代码、链接
     */
    renderInline(children) {
        let result = '';
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            switch (child.type) {
                case 'text':
                    result += child.content;
                    break;
                case 'strong_open':
                    result += STYLES.bold(children[++i].content);
                    i++; // skip close
                    break;
                case 'em_open':
                case 'italic_open':
                    result += STYLES.italic(children[++i].content);
                    i++;
                    break;
                case 'code_inline':
                    result += STYLES.code(child.content);
                    break;
                case 'link_open':
                    result += STYLES.link(children[++i].content);
                    i++; // skip close
                    break;
                case 'softbreak':
                case 'hardbreak':
                    result += '\n';
                    break;
                default:
                    result += child.content || '';
            }
        }
        return result;
    }
    /**
     * 计算文本在终端的可视行数
     */
    getVisualLineCount(text, screenWidth) {
        const stripAnsi = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        const lines = text.split('\n');
        let totalLines = 0;
        for (const line of lines) {
            const expandedLine = line.replace(/\t/g, '        ');
            const cleanLine = stripAnsi(expandedLine);
            let lineWidth = 0;
            for (const char of cleanLine) {
                const code = char.codePointAt(0) || 0;
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
     */
    startChunking() {
        return (chunk) => {
            this.onChunk(chunk);
            if (this.autoFinish && this.isComplete()) {
                this.finish();
            }
        };
    }
    /**
     * 渲染表格
     */
    renderTable(tableData) {
        if (tableData.length === 0)
            return '';
        // 计算每列的最大宽度
        const colCount = Math.max(...tableData.map(row => row.length));
        const colWidths = [];
        for (let col = 0; col < colCount; col++) {
            const max = Math.max(...tableData.map(row => (row[col] || '').length));
            colWidths.push(max + 2); // 加上 2 个空格 padding
        }
        let output = '';
        // 渲染每一行
        tableData.forEach((row, rowIndex) => {
            const cells = row.map((cell, colIndex) => {
                const width = colWidths[colIndex];
                const padded = cell.padEnd(width);
                // 第一行（表头）加粗
                return rowIndex === 0 ? chalk_1.default.bold(padded) : padded;
            });
            output += '│' + cells.join('│') + '│\n';
            // 表头后加分隔线
            if (rowIndex === 0) {
                const separators = colWidths.map(w => '─'.repeat(w));
                output += '├' + separators.join('┼') + '┤\n';
            }
        });
        return output;
    }
    /**
     * Check if response appears complete
     */
    isComplete() {
        const trimmed = this.buffer.trim();
        return trimmed.endsWith('```') ||
            trimmed.endsWith('.') ||
            (trimmed.length > 50 && trimmed.endsWith('\n'));
    }
}
exports.StreamMarkdownRenderer = StreamMarkdownRenderer;
//# sourceMappingURL=renderer.js.map