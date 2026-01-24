import chalk from 'chalk';
import MarkdownIt from 'markdown-it';
import ora, { Ora } from 'ora';

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
  h1: (t: string) => chalk.bold.hex('#FF6B6B')(`# ${t}`),
  h2: (t: string) => chalk.bold.hex('#4ECDC4')(`## ${t}`),
  h3: (t: string) => chalk.bold.hex('#45B7D1')(`### ${t}`),
  h4: (t: string) => chalk.bold.hex('#96E6A1')(`#### ${t}`),
  h5: (t: string) => chalk.bold.hex('#DDA0DD')(`##### ${t}`),
  h6: (t: string) => chalk.bold.hex('#87CEEB')(`###### ${t}`),
  code: (t: string) => chalk.bgHex('#2D3748').hex('#CBD5E0')(` ${t} `),
  code_block: (t: string) => chalk.gray('│ ') + chalk.yellowBright(t),
  bold: (t: string) => chalk.hex('#F06560')(t),
  italic: (t: string) => chalk.italic.hex('#C7B8EA')(t),
  link: (t: string) => chalk.underline.hex('#63B3ED')(t),
  list_item: (t: string) => `  ${chalk.yellow('•')} ${t}`,
  ordered_item: (t: string, index: number) => `  ${chalk.cyan(`${index}.`)} ${t}`,
  blockquote: (t: string) => chalk.hex('#A0AEC0')(`> ${t}`),
};

interface RendererOptions {
  prefix?: string;
  autoFinish?: boolean;
  onChunkCallback?: (chunk: string) => void;
  quietMode?: boolean;
}

export class StreamMarkdownRenderer {
  private md: MarkdownIt;
  private prefix: string;
  private buffer: string = '';
  private isFirstOutput: boolean = true;
  private spinner: Ora | null = null;
  private startTime: number;
  private quietMode: boolean;
  private autoFinish: boolean;
  private onChunkCallback: ((chunk: string) => void) | null;

  constructor(prefix: string = chalk.bold.blue('🤖 AI：'), spinner?: Ora, options?: RendererOptions | boolean) {
    this.prefix = prefix;
    this.spinner = spinner || null;
    this.startTime = Date.now();

    // Support both old boolean quietMode and new options object
    if (typeof options === 'boolean') {
      this.quietMode = options;
      this.autoFinish = false;
      this.onChunkCallback = null;
    } else {
      this.quietMode = options?.quietMode ?? false;
      this.autoFinish = options?.autoFinish ?? false;
      this.onChunkCallback = options?.onChunkCallback || null;
    }

    // 初始化 markdown-it（禁用 HTML）
    this.md = new MarkdownIt({
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
  public onChunk(chunk: string): void {
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
  public finish(): string {
    // 如果 Spinner 还在转（说明没有任何输出），先停掉
    if (this.spinner && this.spinner.isSpinning) {
      this.spinner.stop();
    }

    // 使用 Token 遍历渲染
    const rendered = this.render(this.buffer);

    if (this.quietMode) {
      if (this.buffer.trim()) {
        process.stdout.write(this.prefix + rendered + '\n');
      }
    } else if (process.stdout.isTTY && this.buffer.trim()) {
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
    } else {
      // 非 TTY 模式或无内容，直接补充换行
      if (this.buffer.trim()) {
        process.stdout.write('\n');
      }
    }

    const elapsed = (Date.now() - this.startTime) / 1000;
    const separator = '─'.repeat(20);
    process.stdout.write(`\n${chalk.gray(separator)} (耗时: ${elapsed.toFixed(2)}s) ${separator}\n\n`);

    return this.buffer;
  }

  /**
   * 使用 markdown-it 的 Token 渲染 Markdown
   * 
   * 这是核心函数：Token -> ANSI 直接映射
   */
  private render(markdown: string): string {
    const tokens = this.md.parse(markdown, {});
    return this.traverse(tokens);
  }

  /**
   * 遍历 Tokens 并转换为 ANSI
   */
  private traverse(tokens: any[]): string {
    let output = '';
    let i = 0;
    let orderedListIndex = 1;
    
    while (i < tokens.length) {
      const token = tokens[i];

      // 处理标题
      if (token.type === 'heading_open') {
        const level = token.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
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
        const lines = code.split('\n').map((l: string) => STYLES.code_block(l));
        output += chalk.gray('╭' + '─'.repeat(30)) + '\n';
        output += lines.join('\n') + '\n';
        output += chalk.gray('╰' + '─'.repeat(30)) + '\n\n';
        i += 1;
        continue;
      }

      if (token.type === 'code_block') {
        const code = token.content.trim();
        const lines = code.split('\n').map((l: string) => STYLES.code_block(l));
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
          if (t.type === 'list_item_open') depth++;
          if (t.type === 'list_item_close') depth--;
          
          if (depth === 1 && t.type === 'inline') {
            content += this.renderInline(t.children || []) + ' ';
          } else if (depth === 1 && t.type === 'paragraph_open') {
            // 处理段落内的 inline
            const nextToken = tokens[j + 1];
            if (nextToken?.type === 'inline') {
              content += this.renderInline(nextToken.children || []) + ' ';
            }
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
          if (t.type === 'list_item_open') depth++;
          if (t.type === 'list_item_close') depth--;
          
          if (depth === 1 && t.type === 'inline') {
            content += this.renderInline(t.children || []) + ' ';
          } else if (depth === 1 && t.type === 'paragraph_open') {
            const nextToken = tokens[j + 1];
            if (nextToken?.type === 'inline') {
              content += this.renderInline(nextToken.children || []) + ' ';
            }
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
          if (t.type === 'blockquote_open') depth++;
          if (t.type === 'blockquote_close') depth--;
          
          if (depth === 1 && t.type === 'inline') {
            content += this.renderInline(t.children || []) + ' ';
          } else if (depth === 1 && t.type === 'paragraph_open') {
            const nextToken = tokens[j + 1];
            if (nextToken?.type === 'inline') {
              content += this.renderInline(nextToken.children || []) + ' ';
            }
          } else if (depth === 1 && t.type === 'softbreak') {
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
        output += chalk.gray('─'.repeat(40)) + '\n\n';
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
  private extractInlineText(tokens: any[], index: number): string {
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
  private renderInline(children: any[]): string {
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
  private getVisualLineCount(text: string, screenWidth: number): number {
    const stripAnsi = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

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
      } else {
        totalLines += Math.ceil(lineWidth / screenWidth);
      }
    }

    return totalLines;
  }

  /**
   * Start chunking mode for Agent Runtime
   */
  public startChunking(): (chunk: string) => void {
    return (chunk: string) => {
      this.onChunk(chunk);
      
      if (this.autoFinish && this.isComplete()) {
        this.finish();
      }
    };
  }

  /**
   * Check if response appears complete
   */
  private isComplete(): boolean {
    const trimmed = this.buffer.trim();
    return trimmed.endsWith('```') ||
           trimmed.endsWith('.') ||
           (trimmed.length > 50 && trimmed.endsWith('\n'));
  }
}
