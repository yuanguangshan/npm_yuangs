import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import open from 'open';
import path from 'path';
import { SSHSession } from '../../ssh/SSHSession';
import { SSHGovernedExecutor, GovernanceService } from '../../ssh/GovernedExecutor';
import { InputBuffer } from '../../ssh/InputBuffer';

export async function startWebTerminal(config: any, port: number = 3000) {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer);

    // Fix path resolution: dist/commands/ssh -> ../../../public
    const publicPath = path.join(__dirname, '../../../public');
    console.log(`📂 Serving static files from: ${publicPath}`);
    app.use(express.static(publicPath));

    io.on('connection', async (socket) => {
        console.log('🌐 Browser connected to yuangs-web-term');

        const session = new SSHSession();
        const inputBuffer = new InputBuffer();
        
        // 这里接入你现有的治理服务逻辑
        const governance: GovernanceService = {
            evaluate: async (ctx) => {
                // 转发给你的 SimpleGovernanceService 或完整的 GovernanceEngine
                // 这里可以 emit 事件给前端，让前端弹出华丽的 UI 确认框
                socket.emit('governance_evaluating', { command: ctx.command });
                return { allowed: true, normalizedCmd: ctx.command }; 
            }
        };

        const executor = new SSHGovernedExecutor(session, governance);

        try {
            await session.connect(config);
            socket.emit('output', '\r\n🛡️  yuangs AI Governance Web Shell Connected\r\n');

            // 核心桥接：SSH 输出 -> WebSocket -> 浏览器
            session.on('data', (data: Buffer) => {
                socket.emit('output', data.toString());
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
                    await executor.handleCommand(cmd, config.host, config.username, unsent);
                    
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

            socket.on('resize', ({ cols, rows }) => {
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

    httpServer.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`🚀 yuangs-web-term is running at ${url}`);
        open(url); // 自动打开浏览器
    });
}
