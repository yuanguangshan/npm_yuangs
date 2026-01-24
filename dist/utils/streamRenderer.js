"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamMarkdownRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const markdown_it_1 = __importDefault(require("markdown-it"));
class StreamMarkdownRenderer {
    md;
    prefix;
    colors;
    buffer = '';
    isFirstOutput = true;
    // Token 状态追踪
    tokenStack = [];
    inCodeBlock = false;
    inInlineCode = false;
    inLink = false;
    constructor(options = {}) {
        this.prefix = options.prefix || '';
        // 默认颜色配置
        this.colors = {
            heading: chalk_1.default.hex('#FF6B6B').bold,
            strong: chalk_1.default.hex('#F06560'),
            em: chalk_1.default.italic.hex('#C7B8EA'),
            code: chalk_1.default.bgHex('#2D3748').hex('#CBD5E0'),
            codespan: chalk_1.default.bgHex('#4A5568').hex('#E2E8F0'),
            link: chalk_1.default.underline.hex('#63B3ED'),
            blockquote: chalk_1.default.hex('#A0AEC0'),
            ...options.colors
        };
        // 初始化 markdown-it（禁用 HTML，启用 CommonMark）
        this.md = new markdown_it_1.default({
            html: false,
            xhtmlOut: false,
            breaks: true,
            langPrefix: 'language-',
            linkify: true,
            typographer: true,
            quotes: '""\'\''
        });
        // 启用 token 流式解析
        this.md.enable(['linkify', 'replacements', 'smartquotes']);
    }
    /**
     * 处理流式 chunk
     *
     * 策略：
     * 1. 累积到 buffer
     * 2. 尝试解析完整的 tokens
     * 3. 渲染可用的 tokens
     * 4. 保留不完整的部分
     */
    onChunk(chunk) {
        if (this.isFirstOutput) {
            process.stdout.write(this.prefix);
            this.isFirstOutput = false;
        }
        this.buffer += chunk;
        this.renderBuffer();
    }
    /**
     * 渲染 buffer 中的完整 tokens
     */
    renderBuffer() {
        try {
            const tokens = this.md.parse(this.buffer, {});
            if (tokens.length === 0)
                return;
            let rendered = '';
            let lastIndex = 0;
            // 找到最后一个不完整的 token 的位置
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                // 检查 token 是否完整
                if (this.isTokenComplete(token, tokens, i)) {
                    rendered += this.renderToken(token);
                    lastIndex = i;
                }
                else {
                    // token 不完整，停止渲染
                    break;
                }
            }
            if (rendered) {
                process.stdout.write(rendered);
                // 保留未渲染的部分
                this.buffer = this.buffer.slice(rendered.length);
            }
        }
        catch (e) {
            // 解析失败，可能是不完整的 Markdown
            // 继续累积，等待完整内容
        }
    }
    /**
     * 检查 token 是否完整
     */
    isTokenComplete(token, tokens, index) {
        // 检查代码块是否闭合
        if (token.type === 'fence' || token.type === 'code_block') {
            return token.markup !== undefined;
        }
        // 检查链接是否闭合
        if (token.type === 'link_open') {
            const nextTokens = tokens.slice(index);
            const hasClose = nextTokens.some(t => t.type === 'link_close');
            return hasClose;
        }
        // 检查强调是否闭合
        if (token.type === 'strong_open' || token.type === 'em_open') {
            const nextTokens = tokens.slice(index);
            const hasClose = nextTokens.some(t => t.type === 'strong_close' && token.type === 'strong_open' ||
                t.type === 'em_close' && token.type === 'em_open');
            return hasClose;
        }
        return true;
    }
    /**
     * 渲染单个 token
     */
    renderToken(token) {
        const type = token.type;
        const content = token.content || '';
        const attrs = token.attrs || [];
        switch (type) {
            case 'heading_open':
                const level = parseInt(attrs[0]?.[1] || '1');
                return this.colors.heading?.(`\n${'#'.repeat(level)} `) || `\n${'#'.repeat(level)} `;
            case 'heading_close':
                return '\n\n';
            case 'paragraph_open':
                return '\n';
            case 'paragraph_close':
                return '\n\n';
            case 'strong_open':
                return this.colors.strong?.('') || '';
            case 'strong_close':
                return '';
            case 'em_open':
                return this.colors.em?.('') || '';
            case 'em_close':
                return '';
            case 'code_inline':
                return this.colors.codespan?.(content) || `\`${content}\``;
            case 'code_block':
            case 'fence':
                return `${this.colors.code?.(content) || `\`\`\`\n${content}\n\`\`\``}\n\n`;
            case 'hardbreak':
                return '\n';
            case 'softbreak':
                return '\n';
            case 'text':
                return content;
            case 'link_open':
                return this.colors.link?.('') || '';
            case 'link_close':
                return '';
            case 'blockquote_open':
                return this.colors.blockquote?.('\n> ') || '\n> ';
            case 'blockquote_close':
                return '\n\n';
            case 'list_item_open':
                return '\n  • ';
            case 'list_item_close':
                return '';
            case 'bullet_list_open':
                return '\n';
            case 'bullet_list_close':
                return '\n';
            case 'ordered_list_open':
                return '\n';
            case 'ordered_list_close':
                return '\n';
            default:
                return '';
        }
    }
    /**
     * 流结束，渲染剩余内容
     */
    finish() {
        if (!this.isFirstOutput && this.buffer.trim()) {
            process.stdout.write('\n\n');
        }
        return this.buffer;
    }
    /**
     * 清空 buffer
     */
    clear() {
        this.buffer = '';
        this.tokenStack = [];
    }
}
exports.StreamMarkdownRenderer = StreamMarkdownRenderer;
//# sourceMappingURL=streamRenderer.js.map