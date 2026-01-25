"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebTerminal = startWebTerminal;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const SSHSession_1 = require("../../ssh/SSHSession");
const GovernedExecutor_1 = require("../../ssh/GovernedExecutor");
const InputBuffer_1 = require("../../ssh/InputBuffer");
async function startWebTerminal(config, port = 3000) {
    const app = (0, express_1.default)();
    const httpServer = (0, http_1.createServer)(app);
    const io = new socket_io_1.Server(httpServer);
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
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../../../public')));
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
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../../public')));
    io.on('connection', async (socket) => {
        console.log('🌐 Browser connected to yuangs-web-term');
        const session = new SSHSession_1.SSHSession();
        const inputBuffer = new InputBuffer_1.InputBuffer();
        // 这里接入你现有的治理服务逻辑
        const governance = {
            evaluate: async (ctx) => {
                // 转发给你的 SimpleGovernanceService 或完整的 GovernanceEngine
                // 这里可以 emit 事件给前端，让前端弹出华丽的 UI 确认框
                socket.emit('governance_evaluating', { command: ctx.command });
                return { allowed: true, normalizedCmd: ctx.command };
            }
        };
        const executor = new GovernedExecutor_1.SSHGovernedExecutor(session, governance);
        try {
            await session.connect(config);
            socket.emit('output', '\r\n🛡️  yuangs AI Governance Web Shell Connected\r\n');
            // 核心桥接：SSH 输出 -> WebSocket -> 浏览器
            session.on('data', (data) => {
                socket.emit('output', data.toString());
            });
            // 核心桥接：浏览器输入 -> WebSocket -> 治理执行器
            socket.on('input', async (data) => {
                const cmd = inputBuffer.push(data);
                if (cmd) {
                    // 触发治理逻辑
                    await executor.handleCommand(cmd, config.host, config.username);
                }
                else {
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
        }
        catch (err) {
            socket.emit('output', `\r\n❌ Connection Failed: ${err.message}\r\n`);
        }
    });
    httpServer.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`🚀 yuangs-web-term is running at ${url}`);
        (0, open_1.default)(url); // 自动打开浏览器
    });
}
//# sourceMappingURL=server.js.map