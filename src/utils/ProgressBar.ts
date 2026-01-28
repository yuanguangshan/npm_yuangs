import chalk from 'chalk';

export interface ProgressBarOptions {
    total: number;
    width?: number;
    completeChar?: string;
    incompleteChar?: string;
    template?: string;
}

/**
 * A lightweight, stylish CLI progress bar
 */
export class ProgressBar {
    private total: number;
    private current: number = 0;
    private width: number;
    private completeChar: string;
    private incompleteChar: string;
    private template: string;

    constructor(options: ProgressBarOptions) {
        this.total = options.total;
        this.width = options.width || 40;
        this.completeChar = options.completeChar || '█';
        this.incompleteChar = options.incompleteChar || '░';
        this.template = options.template || '{bar} {percentage}% | {value}/{total} tasks';
    }

    public update(current: number, extraData: Record<string, string | number> = {}) {
        this.current = current;
        this.render(extraData);
    }

    /**
     * Safe logging that clears the bar, prints the message, and re-renders the bar
     */
    public log(message: string) {
        process.stdout.write(`\r\x1b[K${message}\n`);
        this.render({});
    }

    public increment(amount: number = 1, extraData: Record<string, string | number> = {}) {
        this.current += amount;
        this.render(extraData);
    }

    private render(extraData: Record<string, string | number>) {
        if (this.total === 0) {
            if (process.stdout.isTTY) {
                process.stdout.write(`\r${chalk.cyan('总体进度:')} ${chalk.green('完成!')} | 0/0 tasks\n`);
            }
            return;
        }

        const percentage = Math.min(100, Math.floor((this.current / this.total) * 100));
        const completeLength = Math.round((this.current / this.total) * this.width);
        const incompleteLength = this.width - completeLength;

        const useColor = process.stdout.isTTY;

        const bar =
            (useColor ? chalk.cyan(this.completeChar.repeat(Math.max(0, completeLength))) : this.completeChar.repeat(Math.max(0, completeLength))) +
            (useColor ? chalk.gray(this.incompleteChar.repeat(Math.max(0, incompleteLength))) : this.incompleteChar.repeat(Math.max(0, incompleteLength)));

        let output = this.template
            .replace('{bar}', bar)
            .replace('{percentage}', useColor ? chalk.bold(percentage.toString()) : percentage.toString())
            .replace('{value}', useColor ? chalk.yellow(this.current.toString()) : this.current.toString())
            .replace('{total}', useColor ? chalk.white(this.total.toString()) : this.total.toString());

        // Replace other placeholders from extraData
        for (const [key, value] of Object.entries(extraData)) {
            output = output.replace(`{${key}}`, value.toString());
        }

        if (process.stdout.isTTY) {
            process.stdout.write(`\r\x1b[K${output}`);
            if (this.current >= this.total) {
                process.stdout.write('\n');
            }
        } else {
            // Non-TTY environment (e.g. CI), log only on significant changes
            if (this.current === 0 || this.current === this.total || this.current % 5 === 0) {
                console.log(`[Progress] ${percentage}% (${this.current}/${this.total})`);
            }
        }
    }

    public static getMultiColorBar(current: number, total: number, width: number = 40): string {
        const percentage = current / total;
        const filled = Math.round(width * percentage);
        const empty = width - filled;

        const gradient = [
            '#FF0000', // Red
            '#FF7F00', // Orange
            '#FFFF00', // Yellow
            '#00FF00', // Green
            '#0000FF', // Blue
            '#4B0082', // Indigo
            '#9400D3'  // Violet
        ];

        let bar = '';
        for (let i = 0; i < filled; i++) {
            // Simple color mapping for progress
            if (percentage < 0.3) bar += chalk.red('█');
            else if (percentage < 0.7) bar += chalk.yellow('█');
            else bar += chalk.green('█');
        }
        bar += chalk.gray('░'.repeat(empty));

        return bar;
    }
}
