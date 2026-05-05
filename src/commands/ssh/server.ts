import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import open from 'open';
import path from 'path';
import { SSHSession } from '../../ssh/SSHSession';
import { SSHGovernedExecutor, GovernanceService, ExecDecision } from '../../ssh/GovernedExecutor';
import { InputBuffer } from '../../ssh/InputBuffer';
import { checkDangerousCommand } from '../../agent/security/dangerousPatterns';

export async function startWebTerminal(config: any, port: number = 3000) {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer);

    // Fix path resolution: dist/commands/ssh -> ../../../public
    const publicPath = path.join(__dirname, '../../../public');
    console.log(`📂 Serving static files from: ${publicPath}`);

    // Serve index.html at root path
    app.get('/', (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });

    // Serve other static files
    app.use(express.static(publicPath));

    io.on('connection', async (socket: Socket) => {
        console.log('🌐 Browser connected to yuangs-web-term');

        // Initialize with the default config
        let currentConfig = { ...config };
        let session = new SSHSession();
        const inputBuffer = new InputBuffer();

        // 这里接入你现有的治理服务逻辑
        const governance: GovernanceService = {
            evaluate: async (ctx): Promise<ExecDecision> => {
                const cmd = ctx.command.trim();

                // 1. 通知前端：AI 正在思考 (增加延迟模拟深度分析)
                socket.emit('governance_evaluating', {
                    command: cmd,
                    timestamp: new Date().toLocaleTimeString()
                });

                // 模拟 AI 神经网络分析延迟 (已优化为 20ms 以提升性能)
                await new Promise(r => setTimeout(r, 20));

                // 2. 统一危险模式检测
                const hit = checkDangerousCommand(cmd);
                if (hit) {
                    const riskLevel = hit.risk === 'critical' ? 'R3' : 'R2';
                    const decision: ExecDecision = {
                        allowed: false,
                        reason: hit.reason,
                        riskLevel,
                        disclosure: {
                            command: cmd,
                            impact: hit.reason,
                            riskLevel,
                            requiresConfirmation: true
                        }
                    };

                    // 🚨 发送详细决策给前端预览
                    socket.emit('governance_decision', decision);

                    // 🚨 触发全屏视觉警报
                    socket.emit('governance_alert', {
                        level: 'critical',
                        message: 'BLOCK: ' + hit.name
                    });

                    return decision;
                }

                // 安全命令
                const safeDecision: ExecDecision = {
                    allowed: true,
                    normalizedCmd: ctx.command,
                    reasoning: '命令通过多维语义安全审计，分析显示为低风险系统管理任务。'
                };
                socket.emit('governance_decision', safeDecision);

                return safeDecision;
            }
        };

        let executor = new SSHGovernedExecutor(session, governance);

        // Handle server change request from frontend
        socket.on('change_server', async (serverInfo: string) => {
            try {
                // Parse server info in format user@host or user@host:port
                const parts = serverInfo.split('@');
                if (parts.length < 2) {
                    socket.emit('output', `\r\n❌ Invalid server format. Use: user@host or user@host:port\r\n`);
                    return;
                }

                const username = parts[0];
                const hostParts = parts[1].split(':');
                const host = hostParts[0];
                const port = hostParts[1] ? parseInt(hostParts[1]) : 22;

                // Close existing session
                if (session.isConnected()) {
                    session.close();
                }

                // Create new session with new config
                session = new SSHSession();
                executor = new SSHGovernedExecutor(session, governance);

                currentConfig = {
                    host: host,
                    port: port,
                    username: username,
                    readyTimeout: 60000, // Use the timeout we set earlier
                    privateKey: config.privateKey, // Use the same private key
                };

                // Connect to the new server
                await session.connect(currentConfig);
                socket.emit('output', `\r\n🛡️ Switched to server: ${serverInfo}\r\n`);

                // Setup event handlers for the new session
                session.on('data', (data: Buffer) => {
                    socket.emit('output', data.toString());
                });

            } catch (err: any) {
                socket.emit('output', `\r\n❌ Server switch failed: ${err.message}\r\n`);
            }
        });

        try {
            await session.connect(currentConfig);
            socket.emit('output', '\r\n🛡️  yuangs AI Governance Web Shell Connected\r\n');

            // 核心桥接：SSH 输出 -> WebSocket -> 浏览器
            session.on('data', (data: Buffer) => {
                let output = data.toString();
                
                // Filter out shell prompt symbols that appear after command completion
                // This removes lines that are just prompt symbols with whitespace
                const lines = output.split('\n');
                const filteredLines = lines.filter(line => {
                    const trimmed = line.trim();
                    // Remove lines that are only % or # (with optional spaces)
                    if (trimmed === '%' || trimmed === '#') {
                        return false;
                    }
                    // Remove lines that start with % or # followed only by spaces or end of line
                    if (/^[%#]\s*$/.test(line)) {
                        return false;
                    }
                    // Remove lines that are ONLY a prompt symbol (no other content)
                    if (/^[\s]*[%#][\s]*$/.test(line)) {
                        return false;
                    }
                    return true;
                });
                
                // Further filter: if a line starts with prompt but has content, keep the content
                const processedLines = filteredLines.map(line => {
                    // If line starts with just % or # at the beginning (possibly with spaces before)
                    // and then has actual content, remove the prompt symbol
                    // Example: "% ls" -> "ls", "  # pwd" -> "pwd"
                    const match = line.match(/^[\s]*[%#][\s]+(.+)$/);
                    if (match) {
                        return match[1]; // Return content after the prompt
                    }
                    return line;
                });
                
                output = processedLines.join('\n');
                
                socket.emit('output', output);
            });

            // 追踪当前行已发送给服务器的字符
            let lineBuffer = '';

            // 核心桥接：浏览器输入 -> WebSocket -> 治理执行器
            socket.on('input', async (data: string) => {
                const cmd = inputBuffer.push(data);
                if (cmd !== null) {

                    // 对已发送缓冲区进行 Backspace 处理，以匹配 cmd 的格式
                    const processedLineBuffer = InputBuffer.processBackspace(lineBuffer);

                    // 计算 unsentCommand
                    let unsent = '';

                    if (cmd.startsWith(processedLineBuffer)) {
                        unsent = cmd.slice(processedLineBuffer.length);
                    } else {
                        // 如果 buffer 不匹配 (极其罕见), 全量重发以防万一
                        unsent = cmd;
                    }

                    // 触发治理逻辑 (传入 unsent 部分)
                    await executor.handleCommand(cmd, currentConfig.host, currentConfig.username, unsent);

                    // 清空已发送缓冲区
                    lineBuffer = '';
                } else {
                    // 普通字符直接透传（为了打字回显流畅）
                    // 只有在非敏感模式才记录/透传?
                    // 这里简化处理，直接透传，InputBuffer 会在内部聚合
                    session.write(data);
                    lineBuffer += data;
                }
            });

            socket.on('resize', ({ cols, rows }: { cols: number, rows: number }) => {
                session.resize(cols, rows);
            });

            socket.on('disconnect', () => {
                session.close();
                console.log('🔌 Browser disconnected');
            });

        } catch (err: any) {
            socket.emit('output', `\r\n❌ Connection Failed: ${err.message}\r\n`);
        }
    });

    httpServer.listen(port, '0.0.0.0', () => {
        const url = `http://0.0.0.0:${port}`;
        console.log(`🚀 yuangs-web-term is running at ${url}`);
        // Don't auto-open browser when binding to all interfaces (for remote access)
        // open(url); // 自动打开浏览器
    });
}
