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

    // 1. 静态资源托管（提供 xterm.js 页面）
    // Assuming 'public' is in the project root, relative to dist/commands/ssh/server.js it would be ../../../public
    // or relative to src/commands/ssh/server.ts it is ../../../public
    // When compiled to dist/commands/ssh/server.js:
    // __dirname is dist/commands/ssh
    // ../../../public is dist/../public -> project_root/public.
    // However, usually public assets are not in dist.
    // If running from src (via ts-node), __dirname is src/commands/ssh.
    // ../../../public matches project_root/public.
    // Let's ensure the path is consistent.
    app.use(express.static(path.join(__dirname, '../../../../public'))); 
    // Wait, original user code said: path.join(__dirname, '../../../public')
    // If __dirname is src/commands/ssh (3 levels deep from root src), then ../../../ leads to root.
    // src/commands/ssh -> commands (..) -> src (..) -> root (..) -> public?
    // /Users/ygs/ygs/npm_yuangs/src/commands/ssh
    // .. -> /src/commands
    // .. -> /src
    // .. -> /Users/ygs/ygs/npm_yuangs
    // So ../../../ is correct.
    
    // BUT! When running 'dist/cli.js', the structure in dist mirrors src.
    // dist/commands/ssh/server.js
    // same depth. So ../../../public works if public is in root.
    
    app.use(express.static(path.join(__dirname, '../../../public')));

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

            // 核心桥接：浏览器输入 -> WebSocket -> 治理执行器
            socket.on('input', async (data: string) => {
                const cmd = inputBuffer.push(data);
                if (cmd) {
                    // 触发治理逻辑
                    await executor.handleCommand(cmd, config.host, config.username);
                } else {
                    // 普通字符直接透传（为了打字回显流畅）
                    session.write(data);
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
