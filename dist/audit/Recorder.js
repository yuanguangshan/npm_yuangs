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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recorder = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const redact_1 = require("../utils/redact");
/**
 * 录像机
 *
 * 职责:
 * - 以流式 NDJSON 格式记录会话
 * - 记录时间戳 (相对时间)
 * - 保证数据落盘安全性
 */
class Recorder {
    startTime;
    stream;
    filePath;
    writeQueue = [];
    draining = false;
    constructor(options) {
        this.startTime = Date.now();
        // 确保审计目录存在 (700)
        const auditDir = path.join(os.homedir(), '.yuangs', 'audit');
        if (!fs.existsSync(auditDir)) {
            fs.mkdirSync(auditDir, { recursive: true, mode: 0o700 });
        }
        else {
            try {
                fs.chmodSync(auditDir, 0o700);
            }
            catch { }
        }
        // 生成文件名: 2026-01-25T17-00-00_user@host_abcd.cast
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${timestamp}_${options.user}@${options.host}.cast`;
        this.filePath = path.join(auditDir, filename);
        this.stream = fs.createWriteStream(this.filePath, { flags: 'a', encoding: 'utf8', mode: 0o600 });
        // 写入 Header
        const header = {
            version: 2,
            width: options.width,
            height: options.height,
            timestamp: Math.floor(this.startTime / 1000),
            title: `SSH session to ${options.user}@${options.host}`,
            env: {
                TERM: process.env.TERM || 'xterm-256color',
                SHELL: '/bin/bash'
            },
            command: options.command || 'yuangs ssh'
        };
        this.stream.write(JSON.stringify(header) + '\n');
        console.log(`📹 Audit loging to: ${this.filePath}`);
    }
    /**
     * 计算相对时间 (秒, 浮点数)
     */
    now() {
        return (Date.now() - this.startTime) / 1000;
    }
    /**
     * 写入帧
     */
    writeFrame(frame) {
        const json = JSON.stringify(frame);
        if (!this.stream.write(json + '\n')) {
            if (!this.draining) {
                this.draining = true;
                this.stream.once('drain', () => {
                    this.draining = false;
                });
            }
        }
    }
    /**
     * 记录输出 (Output) — 脱敏后落盘
     */
    recordOutput(data) {
        const text = typeof data === 'string' ? data : data.toString('utf8');
        this.writeFrame([this.now(), 'o', (0, redact_1.redactSecrets)(text)]);
    }
    /**
     * 记录输入 (Input) — 脱敏后落盘
     */
    recordInput(data, meta) {
        this.writeFrame([this.now(), 'i', (0, redact_1.redactSecrets)(data), meta]);
    }
    /**
     * 记录窗口调整 (Resize)
     */
    recordResize(cols, rows) {
        this.writeFrame([this.now(), 'r', JSON.stringify({ w: cols, h: rows })]);
    }
    /**
     * 记录治理事件 (Governance) - yuangs 扩展，details 脱敏
     */
    recordGovernance(event, details) {
        let redactedDetails = details;
        try {
            if (details)
                redactedDetails = JSON.parse((0, redact_1.redactSecrets)(JSON.stringify(details)));
        }
        catch { }
        this.writeFrame([this.now(), 'g', event, redactedDetails]);
    }
    /**
     * 结束录制
     */
    close() {
        this.stream.end();
    }
    getFilePath() {
        return this.filePath;
    }
}
exports.Recorder = Recorder;
//# sourceMappingURL=Recorder.js.map