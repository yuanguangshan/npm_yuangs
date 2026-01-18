import chalk from 'chalk';
import * as marked from 'marked';
import TerminalRenderer from 'marked-terminal';
import ora, { Ora } from 'ora';

// 初始化 marked 配置
marked.setOptions({
    renderer: new TerminalRenderer({
        tab: 2,
        width: process.stdout.columns || 80,
        showSectionPrefix: false
    }) as any
});

export class StreamMarkdownRenderer {
    private fullResponse: string = '';
    private prefix: string;
    private isFirstOutput: boolean = true;
    private spinner: Ora | null = null;
    private startTime: number;

    constructor(prefix: string = chalk.bold.blue('🤖 AI：'), spinner?: Ora) {
        this.prefix = prefix;
        this.spinner = spinner || null;
        this.startTime = Date.now();
    }

    /**
     * 处理流式数据块
     */
    public onChunk(chunk: string) {
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.stop();
        }

        if (this.isFirstOutput) {
            process.stdout.write(this.prefix);
            this.isFirstOutput = false;
        }

        this.fullResponse += chunk;
        process.stdout.write(chunk);
    }

    /**
     * 流结束，执行回滚并渲染 Markdown
     */
    public finish(): string {
        // 如果 Spinner 还在转（说明没有任何输出），先停掉
        if (this.spinner && this.spinner.isSpinning) {
            this.spinner.stop();
        }

        const formatted = (marked.parse(this.fullResponse, { async: false }) as string).trim();

        if (process.stdout.isTTY && this.fullResponse.trim()) {
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
        } else {
            // 非 TTY 模式或无内容，直接补充换行（如果之前输出了内容）
            if (this.fullResponse.trim()) {
                process.stdout.write('\n'); 
            }
        }

        // 输出耗时统计
        const elapsed = (Date.now() - this.startTime) / 1000;
        process.stdout.write('\n' + chalk.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n\n'));

        return this.fullResponse;
    }

    /**
     * 计算文本在终端的可视行数
     */
    private getVisualLineCount(text: string, screenWidth: number): number {
        const stripAnsi = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

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
            } else {
                totalLines += Math.ceil(lineWidth / screenWidth);
            }
        }

        return totalLines;
    }
}
