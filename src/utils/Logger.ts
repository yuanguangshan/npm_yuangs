import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export interface LogEntry {
    timestamp: string;
    level: string;
    module: string;
    message: string;
    data?: any;
}

/**
 * 结构化日志系统
 */
export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.INFO;
    private logFile?: string;

    private constructor() {
        // 默认日志文件位置
        const logDir = path.join(process.cwd(), '.ai', 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const today = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logDir, `${today}.log`);
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setLogLevel(level: LogLevel) {
        this.logLevel = level;
    }

    private formatMessage(entry: LogEntry): string {
        const ts = chalk.gray(`[${entry.timestamp}]`);
        const mod = chalk.cyan(`[${entry.module}]`);
        let msg = entry.message;

        switch (entry.level) {
            case 'DEBUG':
                msg = chalk.gray(msg);
                break;
            case 'INFO':
                msg = chalk.white(msg);
                break;
            case 'WARN':
                msg = chalk.yellow(msg);
                break;
            case 'ERROR':
                msg = chalk.red.bold(msg);
                break;
        }

        return `${ts} ${mod} ${msg}`;
    }

    private log(level: LogLevel, module: string, message: string, data?: any) {
        if (level < this.logLevel) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: LogLevel[level],
            module,
            message,
            data,
        };

        // 控制台输出
        console.log(this.formatMessage(entry));
        if (data && level >= LogLevel.WARN) {
            console.dir(data, { depth: null });
        }

        // 写入文件
        if (this.logFile) {
            try {
                fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
            } catch (e) {
                // 忽略日志写入错误，避免干扰主流程
            }
        }
    }

    public debug(module: string, message: string, data?: any) {
        this.log(LogLevel.DEBUG, module, message, data);
    }

    public info(module: string, message: string, data?: any) {
        this.log(LogLevel.INFO, module, message, data);
    }

    public warn(module: string, message: string, data?: any) {
        this.log(LogLevel.WARN, module, message, data);
    }

    public error(module: string, message: string, data?: any) {
        this.log(LogLevel.ERROR, module, message, data);
    }
}

export const logger = Logger.getInstance();
