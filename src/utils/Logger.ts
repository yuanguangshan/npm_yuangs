import pino, { Logger as PinoLogger, DestinationStream } from 'pino';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

type LogLevelName = 'debug' | 'info' | 'warn' | 'error';

const LOG_DIR = path.join(os.homedir(), '.yuangs', 'logs');

function getLogFilePath(): string {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    const today = new Date().toISOString().slice(0, 10);
    return path.join(LOG_DIR, `${today}.log`);
}

function getEnvLogLevel(): LogLevelName | undefined {
    const level = process.env.YUANGS_LOG_LEVEL?.toLowerCase();
    if (['debug', 'info', 'warn', 'error'].includes(level || '')) return level as LogLevelName;
    return undefined;
}

const LEVEL_MAP: Record<LogLevelName, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
};

/**
 * 模块级日志包装器，自动附加 module 字段
 */
export class ModuleLogger {
    constructor(private pino: PinoLogger, private module: string) { }

    debug(message: string, data?: Record<string, unknown>): void {
        this.pino.debug({ module: this.module, msg: message, ...data });
    }

    info(message: string, data?: Record<string, unknown>): void {
        this.pino.info({ module: this.module, msg: message, ...data });
    }

    warn(message: string, data?: Record<string, unknown>): void {
        this.pino.warn({ module: this.module, msg: message, ...data });
    }

    error(message: string, data?: Record<string, unknown>): void {
        this.pino.error({ module: this.module, msg: message, ...data });
    }
}

/**
 * 结构化日志系统（pino 实现）
 * - 双输出：JSON 追加到 ~/.yuangs/logs/<date>.log + 终端标准输出
 * - 级别通过 YUANGS_LOG_LEVEL 环境变量控制（默认 info）
 */
export class Logger {
    private static instance: Logger | null = null;
    private pino!: PinoLogger;

    private constructor() {
        this.init();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /** 测试用：重置单例 */
    public static resetForTesting(): void {
        if (Logger.instance) {
            Logger.instance.flush();
            Logger.instance = null;
        }
    }

    private init(): void {
        const envLevel = getEnvLogLevel();
        const logStream: DestinationStream = fs.createWriteStream(getLogFilePath(), { flags: 'a' });

        this.pino = pino({
            level: envLevel || 'info',
            formatters: {
                level: (label) => ({ level: label.toUpperCase() }),
            },
        }, pino.multistream([
            { stream: logStream, level: 'trace' },
            { stream: pino.destination({ dest: 1, sync: false }), level: envLevel || 'info' },
        ]));
    }

    private flush(): void {
        this.pino?.flush();
    }

    public setLogLevel(level: LogLevel): void {
        const name = LogLevel[level].toLowerCase() as LogLevelName;
        this.pino.level = name;
    }

    /** 获取当前日志级别 */
    public get level(): LogLevel {
        return LEVEL_MAP[this.pino.level as LogLevelName] ?? LogLevel.INFO;
    }

    public child(module: string): ModuleLogger {
        return new ModuleLogger(this.pino.child({ module }), module);
    }

    public debug(module: string, message: string, data?: any): void {
        this.pino.debug({ module, msg: message, data });
    }

    public info(module: string, message: string, data?: any): void {
        this.pino.info({ module, msg: message, data });
    }

    public warn(module: string, message: string, data?: any): void {
        this.pino.warn({ module, msg: message, data });
    }

    public error(module: string, message: string, data?: any): void {
        this.pino.error({ module, msg: message, data });
    }
}

export const logger = Logger.getInstance();
