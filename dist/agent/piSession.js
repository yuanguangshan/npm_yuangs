"use strict";
/**
 * piSession.ts — pi 引擎嵌入层（Route A 迁移）
 *
 * 将 yuangs 的 agent 循环替换为 pi 的 createAgentSession 引擎，保留 yuangs 治理层。
 *
 * 架构：
 *   yuangs 命令 → PiSession.run() → pi createAgentSession 引擎
 *        │                                │
 *        │  治理：beforeToolCall ─────────┼──► GovernanceService.adjudicate()
 *        │  审计：subscribe ──────────────┼──► auditHook()
 *        │  渲染：subscribe ──────────────┼──► onChunk / renderer
 *        └────────────────────────────────┘
 *
 * pi 是 ESM-only，yuangs 是 CommonJS：用 nativeImport 动态加载（与 piAdapter 相同手法）。
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YUANGS_ONLY_TOOL_NAMES = exports.PiSession = exports.PiEngine = void 0;
exports.adaptYuangsToolToPi = adaptYuangsToolToPi;
exports.createPiSession = createPiSession;
exports.createEngineWithFallback = createEngineWithFallback;
const governance_1 = require("./governance");
const ConfigService_1 = require("../core/ConfigService");
const client_1 = require("../ai/client");
const aiproxyAdapter_1 = require("./aiproxyAdapter");
const piModelConfig_1 = require("./piModelConfig");
const chalk_1 = __importDefault(require("chalk"));
// ─── ESM → CJS 桥 ───
const nativeImport = new Function('specifier', 'return import(specifier)');
let _piSdk = null;
let _piLoadError = null;
async function loadPiSdk() {
    if (_piSdk)
        return _piSdk;
    if (_piLoadError)
        throw new Error(`pi SDK 加载失败: ${_piLoadError}`);
    try {
        _piSdk = (await nativeImport('@earendil-works/pi-coding-agent'));
        return _piSdk;
    }
    catch (err) {
        _piLoadError = err?.message || String(err);
        throw new Error(`pi SDK 加载失败: ${_piLoadError}（需 Node >= 22.19，且已安装 @earendil-works/pi-coding-agent）`);
    }
}
class PiEngine {
    runtime;
    model;
    providerId = 'yuangs-proxy';
    constructor(runtime, model) {
        this.runtime = runtime;
        this.model = model;
    }
    /** 创建引擎：注册 yuangs-proxy provider，解析真实 Model 对象。 */
    static async create(options = {}) {
        const sdk = await loadPiSdk();
        const runtime = await sdk.ModelRuntime.create();
        // ConfigService.init 是异步的（cli.ts 里 fire-and-forget），这里显式 await 保证配置已加载
        await (0, ConfigService_1.getConfigService)().init();
        const svc = (0, ConfigService_1.getConfigService)();
        const useAiProxy = !!process.env.YUANGS_USE_AI_PROXY;
        if (useAiProxy) {
            // 走 aiproxy（非标准 <toolcall> 文本协议，需自定义 streamSimple）
            const svc = (0, ConfigService_1.getConfigService)();
            const aiProxyUrl = svc.getAiProxyUrl();
            const configuredModel = options.modelId ?? svc.getDefaultModel();
            if (!configuredModel)
                throw new Error('未配置默认模型（ConfigService.getDefaultModel 为空）');
            const TOOL_UNSAFE_MODELS = new Set(['Assistant', 'free', 'Pro', 'Flash', 'Lite']);
            const modelId = TOOL_UNSAFE_MODELS.has(configuredModel) ? 'deepseek_opencode' : configuredModel;
            const svcCfg = (0, client_1.getUserConfig)();
            // YUANGS_AI_PROXY_STANDARD=1 时用 pi 内置 openai-completions 传输层（标准 tool_calls），
            // 否则用自定义 streamSimple 解析 <toolcall> 文本协议
            const useStandardTransport = process.env.YUANGS_AI_PROXY_STANDARD === '1';
            runtime.registerProvider('yuangs-proxy', {
                name: 'yuangs AI Proxy',
                api: 'openai-completions',
                baseUrl: (0, piModelConfig_1.extractBaseUrl)(aiProxyUrl),
                apiKey: process.env.YUANGS_AI_API_KEY || 'sk-frontend',
                ...(useStandardTransport ? {} : { streamSimple: aiproxyAdapter_1.streamOpencode }),
                headers: {
                    'X-Client-ID': 'npm_yuangs',
                    Origin: 'https://cli.want.biz',
                    Referer: 'https://cli.want.biz/',
                    account: svcCfg.accountType ?? '',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
                    Accept: 'application/json',
                },
                models: [
                    {
                        id: modelId,
                        name: modelId,
                        reasoning: false,
                        input: ['text'],
                        output: ['text'],
                        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                        contextWindow: 128_000,
                        maxTokens: 8_192,
                    },
                ],
            });
            const model = runtime.getModel('yuangs-proxy', modelId);
            if (!model)
                throw new Error(`模型 ${modelId} 注册后无法解析`);
            return new PiEngine(runtime, model);
        }
        // 从 ~/.yuangs.json 的 providers 配置注册模型端点（标准 OpenAI 兼容，pi 内置传输层原生支持 tool_calls）
        const providers = svc.get('providers') ?? [];
        const registeredProviders = [];
        for (const provider of providers) {
            if (!provider.id || !provider.baseUrl) {
                console.warn(`⚠️  跳过无效 provider 配置（缺少 id/baseUrl）: ${JSON.stringify(provider.id ?? provider).slice(0, 60)}`);
                continue;
            }
            // apiKey 支持配置字段或 <ID>_API_KEY 环境变量
            const apiKey = provider.apiKey ?? process.env[`${provider.id.toUpperCase()}_API_KEY`] ?? options.apiKey;
            if (!apiKey) {
                console.warn(`⚠️  跳过 provider "${provider.id}"：缺少 apiKey（配置 providers[].apiKey 或设 ${provider.id.toUpperCase()}_API_KEY）`);
                continue;
            }
            const models = (provider.models ?? []).map((m) => ({
                id: m.id,
                name: m.id,
                reasoning: !!m.reasoning,
                input: ['text'],
                output: ['text'],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: m.contextWindow ?? 128_000,
                maxTokens: m.maxTokens ?? 8_192,
                // provider 级 compat（如 supportsFinishReason:false 兼容无 finish_reason 的免费池上游）
                ...(provider.compat ? { compat: provider.compat } : {}),
            }));
            if (models.length === 0) {
                console.warn(`⚠️  跳过 provider "${provider.id}"：models 为空`);
                continue;
            }
            runtime.registerProvider(provider.id, {
                name: provider.name ?? provider.id,
                api: 'openai-completions',
                baseUrl: provider.baseUrl,
                apiKey,
                models,
            });
            registeredProviders.push({ providerId: provider.id, modelIds: models.map((m) => m.id) });
        }
        if (registeredProviders.length === 0) {
            throw new Error('未配置任何可用模型端点：请在 ~/.yuangs.json 配置 providers 数组（id/baseUrl/apiKey/models），' +
                'apiKey 也可用 <ID>_API_KEY 环境变量提供');
        }
        // 解析目标模型：options.modelId 优先（-m 参数），否则 PI_DEFAULT_MODEL / 配置文件 defaultModel
        const requested = options.modelId ??
            process.env.PI_DEFAULT_MODEL ??
            (svc.get('defaultModel') && !['Assistant', 'free'].includes(svc.get('defaultModel'))
                ? svc.get('defaultModel')
                : undefined) ??
            'deepseek-v4-flash';
        // defaultProvider：同模型多端点（如 deepseek-v4-flash 在 DeepSeek 官方和 opencode 都有）时决定默认路由
        const defaultProvider = svc.get('defaultProvider');
        let resolved;
        if (defaultProvider) {
            const preferred = registeredProviders.find((p) => p.providerId === defaultProvider);
            if (preferred && preferred.modelIds.includes(requested)) {
                resolved = { providerId: preferred.providerId, modelId: requested };
            }
        }
        if (!resolved) {
            for (const p of registeredProviders) {
                if (p.modelIds.includes(requested)) {
                    resolved = { providerId: p.providerId, modelId: requested };
                    break;
                }
            }
        }
        if (!resolved) {
            const all = registeredProviders.flatMap((p) => p.modelIds.map((id) => `${p.providerId}/${id}`)).join(', ');
            throw new Error(`模型 ${requested} 未在任何已注册 provider 中找到。可用：${all}`);
        }
        const model = runtime.getModel(resolved.providerId, resolved.modelId);
        if (!model)
            throw new Error(`模型 ${resolved.providerId}/${resolved.modelId} 注册后无法解析`);
        return new PiEngine(runtime, model);
    }
    /** 创建嵌入会话（pi 引擎 + yuangs 治理）。 */
    async createSession(options) {
        const sdk = await loadPiSdk();
        // 工具：pi 内置白名单 + 仅保留 pi 没有的 yuangs 工具
        const customTools = [];
        for (const t of options.yuangsTools ?? []) {
            customTools.push(await adaptYuangsToolToPi(t));
        }
        const tools = options.tools ?? ['read', 'ls', 'grep', 'find', 'bash', 'edit', 'write'];
        const { session } = await sdk.createAgentSession({
            cwd: options.cwd ?? process.cwd(),
            modelRuntime: this.runtime,
            model: this.model,
            tools,
            customTools,
        });
        // 治理：执行前经 GovernanceService.adjudicate 裁决
        session.agent.beforeToolCall = await makeGovernanceHook(options);
        // 治理：执行后（备份清理 / diff 预览等由 yuangs 侧工具自行处理，此处留钩子）
        session.agent.afterToolCall = async (_ctx) => undefined;
        // 治理：策略手册注入系统提示（替代原 LLMCaller.buildPrompt 里的 getPolicyManual）
        const policyManual = governance_1.GovernanceService.getPolicyManual();
        if (policyManual) {
            session.agent.state.systemPrompt =
                `${policyManual}\n\n` + (session.agent.state.systemPrompt ?? '');
        }
        const audit = options.auditHook;
        if (audit) {
            session.subscribe((event) => {
                void audit(event);
            });
        }
        return new PiSession(session, options);
    }
}
exports.PiEngine = PiEngine;
// ─── 2. 工具转换：yuangs Tool → pi ToolDefinition ───
/** ToolParameter → TypeBox schema（需在 yuangs package.json 加 "typebox": "1.3.7" 直接依赖）。 */
async function paramToTypeBox(param) {
    const Type = await requireTypeBox();
    const base = param.type === 'string'
        ? Type.String()
        : param.type === 'number'
            ? Type.Number()
            : param.type === 'boolean'
                ? Type.Boolean()
                : Type.Array(Type.Any());
    // TypeBox 的描述放在 schema 上
    if (param.description)
        base.description = param.description;
    return base;
}
let _typebox = null;
async function requireTypeBox() {
    if (!_typebox) {
        // typebox 1.x 是 ESM-only，CJS 上下文必须用 nativeImport 加载。
        _typebox = await nativeImport('typebox');
    }
    return _typebox;
}
/**
 * 将 yuangs 的 Tool 转为 pi 的 ToolDefinition（piAdapter 的逆向）。
 * pi execute 返回 AgentToolResult；yuangs 返回 ToolExecutionResult。
 */
async function adaptYuangsToolToPi(tool) {
    const Type = await requireTypeBox();
    const props = {};
    const required = [];
    for (const p of tool.parameters) {
        props[p.name] = await paramToTypeBox(p);
        if (p.required)
            required.push(p.name);
    }
    const parameters = Type.Object(props, required.length > 0 ? { additionalProperties: false } : { additionalProperties: false });
    return {
        name: tool.name,
        label: tool.name,
        description: tool.description,
        parameters,
        async execute(_toolCallId, params, signal, onUpdate) {
            // 流式上报：yuangs 工具没有 onUpdate 概念，但保留回调契约
            void onUpdate;
            const result = await tool.execute(params);
            if (signal?.aborted)
                throw new Error('Operation aborted');
            return {
                content: [{ type: 'text', text: result.output }],
                details: { success: result.success, error: result.error, artifacts: result.artifacts },
            };
        },
    };
}
// ─── 3. 治理适配：pi toolCall → yuangs ProposedAction → adjudicate ───
/** pi 工具名 → yuangs action type 的粗略映射（可按需扩展）。 */
function toolToActionType(toolName) {
    if (toolName === 'bash' || toolName === 'shell_cmd')
        return 'shell_cmd';
    if (toolName === 'write' || toolName === 'edit' || toolName === 'append')
        return 'code_diff';
    return 'tool_call';
}
async function makeGovernanceHook(options) {
    // governance 展示用的工具信息表（yuangs 自有工具；pi 内置工具按名字映射 action type）
    const allTools = Object.fromEntries((options.yuangsTools ?? []).map((t) => [t.name, t]));
    return async ({ toolCall, args }) => {
        const tool = allTools[toolCall.name];
        const action = {
            id: toolCall.id,
            type: toolToActionType(toolCall.name),
            payload: {
                tool_name: toolCall.name,
                parameters: args ?? toolCall.arguments,
                ...(toolCall.name === 'bash' ? { command: (args?.command ?? '') } : {}),
            },
            riskLevel: 'low',
            reasoning: '',
        };
        const decision = await governance_1.GovernanceService.adjudicate(action);
        if (decision.status === 'rejected') {
            console.log(chalk_1.default.yellow(`⛔ Governance 拒绝 ${toolCall.name}: ${decision.reason ?? 'Policy denied'}`));
            return { block: true, reason: decision.reason ?? `治理策略拒绝执行 ${toolCall.name}` };
        }
        return undefined;
    };
}
// ─── 4. PiSession：run/steer/abort + 渲染订阅 ───
class PiSession {
    session;
    options;
    unsubscribe = null;
    currentOnChunk;
    /** 已发送文本长度（message_update 携带完整累积文本，只发增量避免重复渲染） */
    lastEmittedTextLen = 0;
    constructor(session, options) {
        this.session = session;
        this.options = options;
        this.currentOnChunk = options.onChunk;
    }
    get isIdle() {
        // AgentSession.isIdle 是 getter 属性（非方法），兼容两种形态。
        return typeof this.session.isIdle === 'function' ? this.session.isIdle() : !!this.session.isIdle;
    }
    /** 订阅事件流：assistant 文本增量 → onChunk；所有事件 → auditHook。 */
    start() {
        if (this.unsubscribe)
            return;
        this.unsubscribe = this.session.subscribe((event) => {
            if (this.currentOnChunk) {
                if (event.type === 'message_start') {
                    // 新消息开始：重置增量计数
                    this.lastEmittedTextLen = 0;
                }
                else if (event.type === 'message_update') {
                    const text = assistantText(event.message);
                    if (text.length > this.lastEmittedTextLen) {
                        this.currentOnChunk(text.slice(this.lastEmittedTextLen));
                        this.lastEmittedTextLen = text.length;
                    }
                }
            }
            if (this.options.auditHook)
                void this.options.auditHook(event);
        });
    }
    /**
     * AgentRuntime.run 兼容签名（drop-in）：
     * run(userInput, mode, onChunk, model, renderer)
     * 忽略 mode/model（模型在引擎创建时固定）；onChunk 每次调用重新绑定。
     */
    async run(userInput, _mode, onChunk, _model, _renderer) {
        if (onChunk)
            this.currentOnChunk = onChunk;
        this.start();
        await this.session.prompt(userInput);
        // 渲染器记录实际使用的模型（模型透明度，finish() 页脚展示）
        const renderer = _renderer;
        const modelId = this.session.model?.id;
        if (renderer?.setModelUsed && modelId) {
            renderer.setModelUsed(modelId);
        }
        // 无渲染器（一次性问答 / 管道输出）：把最终回答打到 stdout
        if (!onChunk) {
            const lastText = lastAssistantText(this.session.messages);
            if (lastText)
                console.log(lastText);
        }
    }
    async steer(text) {
        await this.session.steer(text);
    }
    async abort() {
        await this.session.abort();
    }
    getContextUsagePercent() {
        return this.session.getContextUsage()?.percent;
    }
    dispose() {
        this.unsubscribe?.();
        this.unsubscribe = null;
    }
}
exports.PiSession = PiSession;
/** 剥离 aiproxy 注入的 [opencode] 前缀（与 yuangs 原 ai/client 一致）。 */
function stripProxyPrefix(text) {
    return text.replace(/^\[opencode\]\s*/, '');
}
/** 从 session 消息历史中提取最后一条 assistant 的纯文本（跳过 thinking 块）。 */
function lastAssistantText(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (!message || message.role !== 'assistant')
            continue;
        const content = message.content;
        if (!Array.isArray(content))
            return undefined;
        const text = content
            .filter((b) => b.type === 'text' && typeof b.text === 'string')
            .map((b) => b.text)
            .join('');
        return stripProxyPrefix(text) || undefined;
    }
    return undefined;
}
/** 从 assistant 消息中提取纯文本（跳过 thinking 块）。 */
function assistantText(message) {
    if (!message || message.role !== 'assistant')
        return '';
    const content = message.content;
    if (!Array.isArray(content))
        return '';
    return content
        .filter((b) => b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text)
        .join('');
}
// ─── 5. 顶层便捷函数：一步建会话 ───
/**
 * pi 没有、需要从 yuangs 保留的工具名。其余 yuangs 工具均可被 pi 内置覆盖。
 */
exports.YUANGS_ONLY_TOOL_NAMES = ['analyze_dependencies'];
/**
 * 一条命令集成：
 *   const engine = await PiEngine.create();
 *   const ps = await engine.createSession({ yuangsTools: getYuangsTools(), onChunk, auditHook });
 *   await ps.run(userInput);
 *   ps.dispose();
 */
async function createPiSession(options) {
    const engine = await PiEngine.create({ modelId: options.modelId });
    return engine.createSession(options);
}
/**
 * 引擎工厂：优先 pi 引擎（Route A），失败回退 AgentRuntime。
 * 供 handleAIChat / cli.ts 一次性问答共用。
 */
async function createEngineWithFallback(options) {
    try {
        return await createPiSession(options);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(chalk_1.default.yellow(`\n⚠️  pi 引擎不可用 (${msg})，回退 AgentRuntime`));
        const { AgentRuntime } = await Promise.resolve().then(() => __importStar(require('./AgentRuntime')));
        const { getConversationHistory } = await Promise.resolve().then(() => __importStar(require('../ai/client')));
        return new AgentRuntime(getConversationHistory());
    }
}
//# sourceMappingURL=piSession.js.map