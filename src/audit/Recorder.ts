import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { redactSecrets } from '../utils/redact';

/**
 * 录像帧类型定义
 * 
 * 格式遵循 asciinema cast v2 (NDJSON) + yuangs 扩展
 * [time, type, data, meta?]
 */
export type Frame = 
  | [number, 'o', string]           // Output: PTY 输出
  | [number, 'i', string, any?]     // Input: 用户/AI 输入 (带 meta)
  | [number, 'r', string]           // Resize: 窗口调整 (json string)
  | [number, 'g', string, any?];    // Governance: 治理事件

/**
 * 录像元数据头
 */
export interface CastHeader {
  version: number;
  width: number;
  height: number;
  timestamp: number;
  title?: string;
  env?: Record<string, string>;
  command?: string;
  theme?: object;
}

/**
 * 录像机
 * 
 * 职责:
 * - 以流式 NDJSON 格式记录会话
 * - 记录时间戳 (相对时间)
 * - 保证数据落盘安全性
 */
export class Recorder {
  private startTime: number;
  private stream: fs.WriteStream;
  private filePath: string;
  private writeQueue: string[] = [];
  private draining = false;

  constructor(options: {
    user: string;
    host: string;
    width: number;
    height: number;
    command?: string;
  }) {
    this.startTime = Date.now();
    
    // 确保审计目录存在 (700)
    const auditDir = path.join(os.homedir(), '.yuangs', 'audit');
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true, mode: 0o700 });
    } else {
      try { fs.chmodSync(auditDir, 0o700); } catch {}
    }

    // 生成文件名: 2026-01-25T17-00-00_user@host_abcd.cast
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${options.user}@${options.host}.cast`;
    this.filePath = path.join(auditDir, filename);

    this.stream = fs.createWriteStream(this.filePath, { flags: 'a', encoding: 'utf8', mode: 0o600 });

    // 写入 Header
    const header: CastHeader = {
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
  private now(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * 写入帧
   */
  private writeFrame(frame: Frame) {
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
  recordOutput(data: string | Buffer) {
    const text = typeof data === 'string' ? data : data.toString('utf8');
    this.writeFrame([this.now(), 'o', redactSecrets(text)]);
  }

  /**
   * 记录输入 (Input) — 脱敏后落盘
   */
  recordInput(data: string, meta?: any) {
    this.writeFrame([this.now(), 'i', redactSecrets(data), meta]);
  }

  /**
   * 记录窗口调整 (Resize)
   */
  recordResize(cols: number, rows: number) {
    this.writeFrame([this.now(), 'r', JSON.stringify({ w: cols, h: rows })]);
  }

  /**
   * 记录治理事件 (Governance) - yuangs 扩展，details 脱敏
   */
  recordGovernance(event: string, details?: any) {
    let redactedDetails = details;
    try {
      if (details) redactedDetails = JSON.parse(redactSecrets(JSON.stringify(details)));
    } catch {}
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
