"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHSession = void 0;
const ssh2_1 = require("ssh2");
const events_1 = require("events");
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
class SSHSession extends events_1.EventEmitter {
    conn = new ssh2_1.Client();
    channel;
    cols = 80;
    rows = 24;
    connected = false;
    /**
     * 建立 SSH 连接并打开 shell
     */
    async connect(opts) {
        return new Promise((resolve, reject) => {
            const config = {
                host: opts.host,
                port: opts.port ?? 22,
                username: opts.username,
            };
            if (opts.privateKey) {
                config.privateKey = opts.privateKey;
                if (opts.passphrase) {
                    config.passphrase = opts.passphrase;
                }
            }
            else if (opts.password) {
                config.password = opts.password;
            }
            this.conn
                .on('ready', () => {
                this.connected = true;
                this.openShell()
                    .then(resolve)
                    .catch(reject);
            })
                .on('error', (err) => {
                this.connected = false;
                reject(err);
            })
                .on('close', () => {
                this.connected = false;
                this.emit('close');
            })
                .connect(config);
        });
    }
    /**
     * 打开 shell (PTY 模式)
     *
     * 关键: 使用 shell() 而不是 exec()
     * - sudo/su/vim/less 都需要 PTY
     * - 这是"活终端",不是 RPC
     */
    openShell() {
        return new Promise((resolve, reject) => {
            this.conn.shell({
                term: 'xterm-256color',
                cols: this.cols,
                rows: this.rows,
            }, (err, stream) => {
                if (err)
                    return reject(err);
                this.channel = stream;
                // stdout/stderr 在 PTY 模式下是同一条流
                // 这是正确行为,不要尝试区分
                stream.on('data', (data) => {
                    this.emit('data', data);
                });
                stream.on('close', () => {
                    this.emit('close');
                    this.conn.end();
                });
                stream.stderr?.on('data', (data) => {
                    this.emit('data', data);
                });
                resolve();
            });
        });
    }
    /**
     * 写入远程 PTY
     */
    write(data) {
        if (!this.channel) {
            throw new Error('SSH channel not ready');
        }
        this.channel.write(data);
    }
    /**
     * 窗口尺寸变更 (xterm / terminal resize)
     *
     * 关键: 如果不处理 resize
     * - vim 会错位
     * - tmux 会崩
     * - 回放画面会错乱
     */
    resize(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        if (this.channel) {
            this.channel.setWindow(rows, cols, 0, 0);
        }
    }
    /**
     * 发送控制信号 (Ctrl+C 等)
     *
     * 注意: ssh2 不会自动处理信号,必须手写
     */
    sendSignal(signal) {
        if (!this.channel)
            return;
        switch (signal) {
            case 'SIGINT':
                // Ctrl+C - ASCII ETX (End of Text)
                this.channel.write('\x03');
                break;
            case 'SIGTERM':
                this.channel.signal('TERM');
                break;
            case 'SIGKILL':
                this.channel.signal('KILL');
                break;
        }
    }
    /**
     * 检查连接状态
     */
    isConnected() {
        return this.connected;
    }
    /**
     * 关闭连接
     */
    close() {
        if (this.channel) {
            this.channel.close();
        }
        this.conn.end();
        this.connected = false;
    }
    /**
     * 获取当前终端尺寸
     */
    getSize() {
        return { cols: this.cols, rows: this.rows };
    }
}
exports.SSHSession = SSHSession;
//# sourceMappingURL=SSHSession.js.map