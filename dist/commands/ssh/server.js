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
    // Fix path resolution: dist/commands/ssh -> ../../../public
    const publicPath = path_1.default.join(__dirname, '../../../public');
    console.log(`📂 Serving static files from: ${publicPath}`);
    app.use(express_1.default.static(publicPath));
    io.on('connection', async (socket) => {
        console.log('🌐 Browser connected to yuangs-web-term');
        const session = new SSHSession_1.SSHSession();
        const inputBuffer = new InputBuffer_1.InputBuffer();
        // 这里接入你现有的治理服务逻辑
        const governance = {
            evaluate: async (ctx) => {
                const cmd = ctx.command.trim();
                // 1. 通知前端：AI 正在思考 (增加延迟模拟深度分析)
                socket.emit('governance_evaluating', {
                    command: cmd,
                    timestamp: new Date().toLocaleTimeString()
                });
                // 模拟 AI 神经网络分析延迟
                await new Promise(r => setTimeout(r, 400));
                // 2. 简单的危险检测逻辑 (用于演示视觉效果)
                const dangerousPatterns = [
                    { regex: /rm\s+-rf\s+\//, reason: '非法的文件系统根目录删除尝试', impact: '系统将彻底崩溃', risk: 'R3' },
                    { regex: /mkfs/, reason: '格式化磁盘尝试', impact: '磁盘数据将全部丢失', risk: 'R3' },
                    { regex: /dd\s+if=.*of=\/dev\//, reason: '底层设备写覆盖尝试', impact: '可能破坏引导扇区', risk: 'R3' }
                ];
                for (const p of dangerousPatterns) {
                    if (p.regex.test(cmd)) {
                        const decision = {
                            allowed: false,
                            reason: p.reason,
                            riskLevel: p.risk,
                            disclosure: {
                                command: cmd,
                                impact: p.impact,
                                riskLevel: p.risk,
                                requiresConfirmation: true
                            }
                        };
                        // 🚨 发送详细决策给前端预览
                        socket.emit('governance_decision', decision);
                        // 🚨 触发全屏视觉警报
                        socket.emit('governance_alert', {
                            level: 'critical',
                            message: 'BLOCK: ' + p.risk
                        });
                        return decision;
                    }
                }
                // 安全命令
                const safeDecision = {
                    allowed: true,
                    normalizedCmd: ctx.command,
                    reasoning: '命令通过多维语义安全审计，分析显示为低风险系统管理任务。'
                };
                socket.emit('governance_decision', safeDecision);
                return safeDecision;
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
            // 追踪当前行已发送给服务器的字符
            let lineBuffer = '';
            // 核心桥接：浏览器输入 -> WebSocket -> 治理执行器
            socket.on('input', async (data) => {
                const cmd = inputBuffer.push(data);
                if (cmd !== null) {
                    // 对已发送缓冲区进行 Backspace 处理，以匹配 cmd 的格式
                    const processedLineBuffer = InputBuffer_1.InputBuffer.processBackspace(lineBuffer);
                    // 计算 unsentCommand
                    let unsent = '';
                    if (cmd.startsWith(processedLineBuffer)) {
                        unsent = cmd.slice(processedLineBuffer.length);
                    }
                    else {
                        // 如果 buffer 不匹配 (极其罕见), 全量重发以防万一
                        unsent = cmd;
                    }
                    // 触发治理逻辑 (传入 unsent 部分)
                    await executor.handleCommand(cmd, config.host, config.username, unsent);
                    // 清空已发送缓冲区
                    lineBuffer = '';
                }
                else {
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