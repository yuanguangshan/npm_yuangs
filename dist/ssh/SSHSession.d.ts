import { EventEmitter } from 'events';
/**
 * SSH 会话配置
 */
export interface SSHSessionOptions {
    host: string;
    port?: number;
    username: string;
    privateKey?: Buffer | string;
    password?: string;
    passphrase?: string;
}
/**
 * SSH 会话管理器
 *
 * 职责:
 * - 管理 SSH 生命周期
 * - 管理 PTY (伪终端)
 * - 处理 resize / signal
 *
 * 不负责:
 * - 治理逻辑
 * - 命令理解
 * - stdout 解析
 */
export declare class SSHSession extends EventEmitter {
    private conn;
    private channel?;
    private cols;
    private rows;
    private connected;
    /**
     * 建立 SSH 连接并打开 shell
     */
    connect(opts: SSHSessionOptions): Promise<void>;
    /**
     * 打开 shell (PTY 模式)
     *
     * 关键: 使用 shell() 而不是 exec()
     * - sudo/su/vim/less 都需要 PTY
     * - 这是"活终端",不是 RPC
     */
    private openShell;
    /**
     * 写入远程 PTY
     */
    write(data: string | Buffer): void;
    /**
     * 窗口尺寸变更 (xterm / terminal resize)
     *
     * 关键: 如果不处理 resize
     * - vim 会错位
     * - tmux 会崩
     * - 回放画面会错乱
     */
    resize(cols: number, rows: number): void;
    /**
     * 发送控制信号 (Ctrl+C 等)
     *
     * 注意: ssh2 不会自动处理信号,必须手写
     */
    sendSignal(signal: 'SIGINT' | 'SIGTERM' | 'SIGKILL'): void;
    /**
     * 检查连接状态
     */
    isConnected(): boolean;
    /**
     * 关闭连接
     */
    close(): void;
    /**
     * 获取当前终端尺寸
     */
    getSize(): {
        cols: number;
        rows: number;
    };
}
