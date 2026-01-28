import chalk from 'chalk';

/**
 * CLI 统一 UI 组件库
 * 封装常用面板、格式化工具，确保显示效果一致且适配终端宽度
 */
export class CLIComponent {
    /**
     * 获取当前终端可用宽度，默认 80
     */
    public static getTerminalWidth(): number {
        return process.stdout.columns || 80;
    }

    /**
     * 渲染任务面板
     */
    public static renderTaskPanel(index: number, description: string, priority: string = 'normal'): void {
        const width = Math.min(this.getTerminalWidth(), 60);
        const contentWidth = width - 4;

        const title = ` 🚀 执行任务: #${index} `;
        const priorityIcon = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
        const priorityText = ` ⚡ 优先级: ${priorityIcon} ${priority} `;

        console.log(chalk.white('╭' + '─'.repeat(width - 2) + '╮'));
        console.log(chalk.white('│') + chalk.bold.cyan(title.padEnd(contentWidth)) + chalk.white('│'));
        console.log(chalk.white('│') + ' '.repeat(contentWidth) + '│');

        // 自动折行处理描述
        const lines = this.wrapText(description, contentWidth - 8);
        lines.forEach((line, i) => {
            const prefix = i === 0 ? ' 📝 内容: ' : '         ';
            console.log(chalk.white('│') + chalk.white((prefix + line).padEnd(contentWidth)) + chalk.white('│'));
        });

        console.log(chalk.white('│') + chalk.white(priorityText.padEnd(contentWidth + 2)) + chalk.white('│'));
        console.log(chalk.white('╰' + '─'.repeat(width - 2) + '╯\n'));
    }

    /**
     * 渲染工作流结束面板
     */
    public static renderSummaryPanel(completed: number, total: number, iterations: number, hasRemaining: boolean): void {
        const width = Math.min(this.getTerminalWidth(), 60);
        const contentWidth = width - 4;

        console.log(chalk.white('╭' + '─'.repeat(width - 2) + '╮'));
        console.log(chalk.white('│') + chalk.bold.green(' ✨ 工作流执行完成!'.padEnd(contentWidth)) + chalk.white('│'));
        console.log(chalk.white('├' + '─'.repeat(width - 2) + '┤'));
        console.log(chalk.white('│') + chalk.white(` ✅ 总体进度: ${completed}/${total} 任务`.padEnd(contentWidth)) + chalk.white('│'));
        console.log(chalk.white('│') + chalk.white(` 🔄 本次执行: ${iterations} 轮任务`.padEnd(contentWidth)) + chalk.white('│'));

        if (hasRemaining) {
            console.log(chalk.white('│') + chalk.yellow(` 💡 提示: 还有未完成任务, 可再次运行 auto 继续`.padEnd(contentWidth + 3)) + chalk.white('│'));
        }
        console.log(chalk.white('╰' + '─'.repeat(width - 2) + '╯\n'));
    }

    /**
     * 简单的文本折行工具
     */
    private static wrapText(text: string, maxWidth: number): string[] {
        const lines: string[] = [];
        let currentLine = '';

        // 如果包含中文字符，长度计算需要特殊处理（此处暂用简单截断）
        for (let i = 0; i < text.length; i++) {
            currentLine += text[i];
            if (currentLine.length >= maxWidth) {
                lines.push(currentLine);
                currentLine = '';
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }
    /**
     * 渲染通用信息面板
     */
    public static renderInfoPanel(title: string, content: string): void {
        const width = Math.min(this.getTerminalWidth(), 70);
        const contentWidth = width - 4;

        console.log(chalk.white('╭' + '─'.repeat(width - 2) + '╮'));
        console.log(chalk.white('│') + chalk.bold.blue(` 📊 ${title} `.padEnd(contentWidth)) + chalk.white('│'));
        console.log(chalk.white('├' + '─'.repeat(width - 2) + '┤'));

        const lines = this.wrapText(content, contentWidth - 4);
        lines.forEach(line => {
            console.log(chalk.white('│') + chalk.white(`  ${line}`.padEnd(contentWidth)) + chalk.white('│'));
        });

        console.log(chalk.white('╰' + '─'.repeat(width - 2) + '╯'));
    }
}
