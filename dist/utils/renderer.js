"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamMarkdownRenderer = exports.MarkdownRenderer = void 0;
exports.renderMarkdown = renderMarkdown;
const chalk_1 = __importDefault(require("chalk"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const cli_table3_1 = __importDefault(require("cli-table3"));
/**
 * 终端 Markdown 原生渲染器
 *
 * 核心思想：
 * - 直接使用 markdown-it 的 md.parse() 解析为 Tokens
 * - 遍历 Tokens 并直接映射为 ANSI 样式
 * - 无需 HTML 中转，性能最优
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
/**
 * 核心渲染引擎：Markdown -> ANSI 映射
 * 将该逻辑剥离以便在流式和静态场景下复用
 */
class MarkdownRenderer {
    md;
    constructor() {
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
     * 将 Markdown 字符串直接转换为带有 ANSI 样式的文本
     */
    render(markdown) {
        const tokens = this.md.parse(markdown, {});
        return this.traverse(tokens);
    }
    /**
     * 遍历 Tokens 并映射为 ANSI 样式 (从 renderer.ts 原 traverse 迁移)
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
                const inlineToken = tokens[i + 1];
                const content = inlineToken?.type === 'inline'
                    ? this.renderInline(inlineToken.children || [])
                    : '';
                output += (STYLES[level] || STYLES.h6)(content) + '\n\n';
                i += 3;
                continue;
            }
            // 处理段落
            if (token.type === 'paragraph_open') {
                const inlineToken = tokens[i + 1];
                if (inlineToken?.type === 'inline') {
                    output += this.renderInline(inlineToken.children || []) + '\n\n';
                }
                i += 3;
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
            // 处理列表项（检测是有序还是无序）
            if (token.type === 'list_item_open') {
                let content = '';
                let j = i + 1;
                let depth = 1;
                // 检查这是否是有序列表项
                let isOrdered = false;
                for (let k = i - 1; k >= 0 && depth === 1; k--) {
                    if (tokens[k].type === 'ordered_list_open') {
                        isOrdered = true;
                        break;
                    }
                    if (tokens[k].type === 'bullet_list_open') {
                        isOrdered = false;
                        break;
                    }
                    if (tokens[k].type === 'list_item_close') {
                        break;
                    }
                }
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
                if (isOrdered) {
                    output += STYLES.ordered_item(content.trim(), orderedListIndex++) + '\n';
                }
                else {
                    output += STYLES.list_item(content.trim()) + '\n';
                }
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
            i += 1;
        }
        return output.trim();
    }
    /**
     * 渲染内联样式
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
                    i++;
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
                    i++;
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
     * 渲染表格 (cli-table3)
     */
    renderTable(tableData) {
        if (tableData.length === 0)
            return '';
        const headers = tableData[0];
        const rows = tableData.slice(1);
        const table = new cli_table3_1.default({
            head: headers,
            style: { head: ['cyan', 'bold'], border: ['gray'] },
            wordWrap: true,
            chars: {
                'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
                'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
                'left': '│', 'left-mid': '', 'mid': '', 'mid-mid': '', 'right': '│', 'right-mid': '', 'middle': '│'
            }
        });
        rows.forEach(row => table.push(row));
        return table.toString() + '\n';
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
/**
 * 将 Markdown 字符串渲染为带有终端 ANSI 样态的字符串 (静态专用)
 */
function renderMarkdown(markdown) {
    const renderer = new MarkdownRenderer();
    return renderer.render(markdown);
}
/**
 * 流式 Markdown 渲染器
 * 继承逻辑引擎，增加流状态管理
 */
class StreamMarkdownRenderer extends MarkdownRenderer {
    prefix;
    buffer = '';
    isFirstOutput = true;
    spinner = null;
    startTime;
    quietMode;
    autoFinish;
    onChunkCallback;
    finished = false;
    constructor(prefix = chalk_1.default.bold.blue('🤖 AI：'), spinner, options) {
        super();
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
     * 从 JSON 格式的响应中提取实际内容
     * 处理格式：{"action_type": "answer", "content": "...", "is_done": true}
     */
    extractContentFromJSON(text) {
        try {
            // 尝试解析 JSON（支持普通 JSON 和 markdown 代码块中的 JSON）
            let jsonText = text.trim();
            // 移除 markdown 代码块标记（```json 和 ```）
            const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (codeBlockMatch) {
                jsonText = codeBlockMatch[1];
            }
            // 尝试提取最外层的 JSON 对象
            const objectMatch = jsonText.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                jsonText = objectMatch[0];
            }
            const parsed = JSON.parse(jsonText);
            // 如果是 AI Agent 响应格式，提取 content 字段
            if (parsed.action_type === 'answer' && parsed.content) {
                return parsed.content;
            }
            // 如果有 content 字段，返回它
            if (parsed.content) {
                return parsed.content;
            }
            // 如果有 final_answer 字段，返回它
            if (parsed.final_answer) {
                return parsed.final_answer;
            }
            // 如果有 text 字段，返回它
            if (parsed.text) {
                return parsed.text;
            }
            // 否则返回原始文本
            return text;
        }
        catch (e) {
            // JSON 解析失败，返回原始文本
            return text;
        }
    }
    /**
     * 流结束，渲染完整 Markdown
     *
     * 使用 md.parse() 解析 Tokens，直接映射为 ANSI
     */
    finish() {
        if (this.finished)
            return this.buffer;
        this.finished = true;
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.stop();
        }
        // 尝试从 JSON 中提取实际内容
        const contentToRender = this.extractContentFromJSON(this.buffer);
        const rendered = this.render(contentToRender);
        if (this.quietMode) {
            if (this.buffer.trim()) {
                process.stdout.write(this.prefix + rendered + '\n');
            }
        }
        else if (this.buffer.trim()) {
            if (process.stdout.isTTY) {
                const screenWidth = process.stdout.columns || 80;
                const totalContent = this.prefix + this.buffer;
                const lineCount = this.getVisualLineCount(totalContent, screenWidth);
                process.stdout.write('\r\x1b[K');
                for (let i = 0; i < lineCount - 1; i++) {
                    process.stdout.write('\x1b[A\x1b[K');
                }
                process.stdout.write(this.prefix + rendered + '\n');
            }
            else {
                process.stdout.write(this.prefix + rendered + '\n');
            }
        }
        const elapsed = (Date.now() - this.startTime) / 1000;
        const separator = '─'.repeat(20);
        process.stdout.write(`\n${chalk_1.default.gray(separator)} (耗时: ${elapsed.toFixed(2)}s) ${separator}\n\n`);
        return this.buffer;
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