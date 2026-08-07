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

import { GovernanceService } from './governance';
import { ProposedAction } from './state';
import { Tool, ToolParameter } from './tools/types';
import { getConfigService } from '../core/ConfigService';
import { getUserConfig } from '../ai/client';
import { streamOpencode } from './aiproxyAdapter';
import { extractBaseUrl } from './piModelConfig';
import { confirm } from '../utils/confirm';
import type { StreamMarkdownRenderer } from '../utils/renderer';
import chalk from 'chalk';

// ─── pi SDK 类型（松散定义，避免 ESM 类型进 CJS 上下文） ───

interface PiModel {
  id: string;
  provider: string;
  api: string;
  baseUrl: string;
}

interface PiAgentTool {
  name: string;
  label: string;
  description: string;
  parameters: any; // TypeBox TSchema
  execute(
    toolCallId: string,
    params: Record<string, any>,
    signal?: AbortSignal,
    onUpdate?: (partial: any) => void
  ): Promise<{ content: Array<{ type: string; text?: string }>; details: any }>;
}

interface PiSdk {
  createAgentSession: (options: Record<string, any>) => Promise<{
    session: {
      prompt: (text: string, opts?: Record<string, any>) => Promise<void>;
      steer: (text: string) => Promise<void>;
      abort: () => Promise<void>;
      subscribe: (listener: (event: any) => void) => () => void;
      agent: {
        state: { systemPrompt: string };
        beforeToolCall: any;
        afterToolCall: any;
      };
      isIdle: () => boolean;
      messages: any[];
      getContextUsage: () => { percent: number } | undefined;
    };
  }>;
  ModelRuntime: {
    create: (options?: Record<string, any>) => Promise<{
      registerProvider: (id: string, config: Record<string, any>) => void;
      getModel: (provider: string, modelId: string) => PiModel | undefined;
    }>;
  };
}

// ─── ESM → CJS 桥 ───

const nativeImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>;

let _piSdk: PiSdk | null = null;
let _piLoadError: string | null = null;

async function loadPiSdk(): Promise<PiSdk> {
  if (_piSdk) return _piSdk;
  if (_piLoadError) throw new Error(`pi SDK 加载失败: ${_piLoadError}`);
  try {
    _piSdk = (await nativeImport('@earendil-works/pi-coding-agent')) as unknown as PiSdk;
    return _piSdk;
  } catch (err: any) {
    _piLoadError = err?.message || String(err);
    throw new Error(`pi SDK 加载失败: ${_piLoadError}（需 Node >= 22.19，且已安装 @earendil-works/pi-coding-agent）`);
  }
}

// ─── 1. 模型运行时：aiProxyUrl → pi provider ───

export interface PiEngineOptions {
  cwd?: string;
  /**
   * 工具白名单（pi 内置工具名，未列出的不可用）。
   * 默认：pi 全套内置（read, ls, grep, find, bash, edit, write）。
   * yuangs 自有工具基本可被 pi 覆盖，只保留 pi 没有的（如 analyze_dependencies）。
   */
  tools?: string[];
  /** yuangs 自有工具（仅 pi 没有的能力才传；自动转为 pi customTools） */
  yuangsTools?: Tool[];
  /** 审计钩子：每个 session 事件都会经过这里 */
  auditHook?: (event: any) => void | Promise<void>;
  /** 渲染钩子：assistant 文本增量 */
  onChunk?: (chunk: string) => void;
  /** 模型 id 覆盖（默认用 ConfigService.defaultModel） */
  modelId?: string;
}

export class PiEngine {
  private runtime: any;
  readonly model: PiModel;
  readonly providerId = 'yuangs-proxy';

  private constructor(runtime: any, model: PiModel) {
    this.runtime = runtime;
    this.model = model;
  }

  /** 创建引擎：注册 yuangs-proxy provider，解析真实 Model 对象。 */
  static async create(options: { modelId?: string; apiKey?: string } = {}): Promise<PiEngine> {
    const sdk = await loadPiSdk();
    const runtime = await sdk.ModelRuntime.create();
    const svc = getConfigService();
    const useAiProxy = !!process.env.YUANGS_USE_AI_PROXY;

    if (useAiProxy) {
      // 走 aiproxy（非标准 <toolcall> 文本协议，需自定义 streamSimple）
      const svc = getConfigService();
      const aiProxyUrl = svc.getAiProxyUrl();
      const configuredModel = options.modelId ?? svc.getDefaultModel();
      if (!configuredModel) throw new Error('未配置默认模型（ConfigService.getDefaultModel 为空）');
      const TOOL_UNSAFE_MODELS = new Set(['Assistant', 'free', 'Pro', 'Flash', 'Lite']);
      const modelId = TOOL_UNSAFE_MODELS.has(configuredModel) ? 'deepseek_opencode' : configuredModel;
      const svcCfg = getUserConfig();
      // YUANGS_AI_PROXY_STANDARD=1 时用 pi 内置 openai-completions 传输层（标准 tool_calls），
      // 否则用自定义 streamSimple 解析 <toolcall> 文本协议
      const useStandardTransport = process.env.YUANGS_AI_PROXY_STANDARD === '1';
      runtime.registerProvider('yuangs-proxy', {
        name: 'yuangs AI Proxy',
        api: 'openai-completions',
        baseUrl: extractBaseUrl(aiProxyUrl),
        apiKey: process.env.YUANGS_AI_API_KEY || 'sk-frontend',
        ...(useStandardTransport ? {} : { streamSimple: streamOpencode }),
        headers: {
          'X-Client-ID': 'npm_yuangs',
          Origin: 'https://cli.want.biz',
          Referer: 'https://cli.want.biz/',
          account: svcCfg.accountType ?? '',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
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
      if (!model) throw new Error(`模型 ${modelId} 注册后无法解析`);
      return new PiEngine(runtime, model);
    }

    // 默认：注册 DeepSeek 官方 + opencode 官方双 provider（标准 OpenAI 兼容，pi 内置传输层原生支持 tool_calls）
    const registeredProviders: Array<{ providerId: string; modelIds: string[] }> = [];

    const deepseekKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY ?? svc.get('deepseekApiKey');
    if (deepseekKey) {
      // DeepSeek 官方端点真实模型：deepseek-v4-flash / deepseek-v4-pro
      const deepseekModels = [
        { id: 'deepseek-v4-flash', reasoning: false },
        { id: 'deepseek-v4-pro', reasoning: true },
      ];
      runtime.registerProvider('deepseek-official', {
        name: 'DeepSeek Official',
        api: 'openai-completions',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: deepseekKey,
        models: deepseekModels.map((m) => ({
          id: m.id,
          name: m.id,
          reasoning: m.reasoning,
          input: ['text'],
          output: ['text'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128_000,
          maxTokens: 8_192,
        })),
      });
      registeredProviders.push({ providerId: 'deepseek-official', modelIds: deepseekModels.map((m) => m.id) });
    }

    const opencodeKey = process.env.OPENCODE_API_KEY ?? svc.get('opencodeApiKey');
    if (opencodeKey) {
      // opencode 官方端点自有模型（不含 deepseek-v4-flash/pro，避免与 DeepSeek 官方重名歧义）
      const opencodeModels = [
        { id: 'qwen3.7-max', reasoning: false },
        { id: 'qwen3.8-max', reasoning: false },
        { id: 'gpt-5.6-luna', reasoning: true },
        { id: 'minimax-m3', reasoning: false },
        { id: 'kimi-k3', reasoning: false },
      ];
      runtime.registerProvider('opencode-official', {
        name: 'opencode official',
        api: 'openai-completions',
        baseUrl: 'https://opencode.ai/zen/go/v1',
        apiKey: opencodeKey,
        models: opencodeModels.map((m) => ({
          id: m.id,
          name: m.id,
          reasoning: m.reasoning,
          input: ['text'],
          output: ['text'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128_000,
          maxTokens: 8_192,
        })),
      });
      registeredProviders.push({ providerId: 'opencode-official', modelIds: opencodeModels.map((m) => m.id) });
    }

    if (registeredProviders.length === 0) {
      throw new Error('未配置任何模型端点：请设置 DEEPSEEK_API_KEY 或 OPENCODE_API_KEY 环境变量');
    }

    // 解析目标模型：options.modelId 优先（-m 参数），否则 PI_DEFAULT_MODEL / 配置文件 defaultModel
    const requested =
      options.modelId ??
      process.env.PI_DEFAULT_MODEL ??
      (svc.get('defaultModel') && !['Assistant', 'free'].includes(svc.get('defaultModel') as string)
        ? svc.get('defaultModel')
        : undefined) ??
      'deepseek-v4-flash';
    let resolved: { providerId: string; modelId: string } | undefined;
    for (const p of registeredProviders) {
      if (p.modelIds.includes(requested)) {
        resolved = { providerId: p.providerId, modelId: requested };
        break;
      }
    }
    if (!resolved) {
      const all = registeredProviders.flatMap((p) => p.modelIds.map((id) => `${p.providerId}/${id}`)).join(', ');
      throw new Error(`模型 ${requested} 未在任何已注册 provider 中找到。可用：${all}`);
    }

    const model = runtime.getModel(resolved.providerId, resolved.modelId);
    if (!model) throw new Error(`模型 ${resolved.providerId}/${resolved.modelId} 注册后无法解析`);
    return new PiEngine(runtime, model);
  }

  /** 创建嵌入会话（pi 引擎 + yuangs 治理）。 */
  async createSession(options: PiEngineOptions): Promise<PiSession> {
    const sdk = await loadPiSdk();

    // 工具：pi 内置白名单 + 仅保留 pi 没有的 yuangs 工具
    const customTools: any[] = [];
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
    session.agent.afterToolCall = async (_ctx: any) => undefined;

    // 治理：策略手册注入系统提示（替代原 LLMCaller.buildPrompt 里的 getPolicyManual）
    const policyManual = GovernanceService.getPolicyManual();
    if (policyManual) {
      session.agent.state.systemPrompt =
        `${policyManual}\n\n` + (session.agent.state.systemPrompt ?? '');
    }

    const audit = options.auditHook;
    if (audit) {
      session.subscribe((event: any) => {
        void audit(event);
      });
    }

    return new PiSession(session, options);
  }
}

// ─── 2. 工具转换：yuangs Tool → pi ToolDefinition ───

/** ToolParameter → TypeBox schema（需在 yuangs package.json 加 "typebox": "1.3.7" 直接依赖）。 */
async function paramToTypeBox(param: ToolParameter): Promise<any> {
  const Type = await requireTypeBox();
  const base =
    param.type === 'string'
      ? Type.String()
      : param.type === 'number'
        ? Type.Number()
        : param.type === 'boolean'
          ? Type.Boolean()
          : Type.Array(Type.Any());
  // TypeBox 的描述放在 schema 上
  if (param.description) base.description = param.description;
  return base;
}

let _typebox: any = null;
async function requireTypeBox(): Promise<any> {
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
export async function adaptYuangsToolToPi(tool: Tool): Promise<any> {
  const Type = await requireTypeBox();
  const props: Record<string, any> = {};
  const required: string[] = [];
  for (const p of tool.parameters) {
    props[p.name] = await paramToTypeBox(p);
    if (p.required) required.push(p.name);
  }
  const parameters = Type.Object(props, required.length > 0 ? { additionalProperties: false } : { additionalProperties: false });

  return {
    name: tool.name,
    label: tool.name,
    description: tool.description,
    parameters,
    async execute(
      _toolCallId: string,
      params: Record<string, any>,
      signal?: AbortSignal,
      onUpdate?: (partial: any) => void
    ): Promise<{ content: Array<{ type: string; text?: string }>; details: any }> {
      // 流式上报：yuangs 工具没有 onUpdate 概念，但保留回调契约
      void onUpdate;
      const result = await tool.execute(params);
      if (signal?.aborted) throw new Error('Operation aborted');
      return {
        content: [{ type: 'text', text: result.output }],
        details: { success: result.success, error: result.error, artifacts: result.artifacts },
      };
    },
  };
}

// ─── 3. 治理适配：pi toolCall → yuangs ProposedAction → adjudicate ───

/** pi 工具名 → yuangs action type 的粗略映射（可按需扩展）。 */
function toolToActionType(toolName: string): ProposedAction['type'] {
  if (toolName === 'bash' || toolName === 'shell_cmd') return 'shell_cmd';
  if (toolName === 'write' || toolName === 'edit' || toolName === 'append') return 'code_diff';
  return 'tool_call';
}

async function makeGovernanceHook(options: PiEngineOptions): Promise<(ctx: any) => Promise<any>> {
  // governance 展示用的工具信息表（yuangs 自有工具；pi 内置工具按名字映射 action type）
  const allTools = Object.fromEntries((options.yuangsTools ?? []).map((t) => [t.name, t]));

  return async ({ toolCall, args }: { toolCall: { id: string; name: string; arguments: any }; args: any }) => {
    const tool = allTools[toolCall.name];
    const action: ProposedAction = {
      id: toolCall.id,
      type: toolToActionType(toolCall.name),
      payload: {
        tool_name: toolCall.name,
        parameters: args ?? toolCall.arguments,
        ...(toolCall.name === 'bash' ? { command: (args?.command ?? '') as string } : {}),
      },
      riskLevel: 'low',
      reasoning: '',
    };

    const decision = await GovernanceService.adjudicate(action);
    if (decision.status === 'rejected') {
      console.log(chalk.yellow(`⛔ Governance 拒绝 ${toolCall.name}: ${decision.reason ?? 'Policy denied'}`));
      return { block: true, reason: decision.reason ?? `治理策略拒绝执行 ${toolCall.name}` };
    }
    return undefined;
  };
}

// ─── 4. PiSession：run/steer/abort + 渲染订阅 ───

export class PiSession {
  private session: any;
  private options: PiEngineOptions;
  private unsubscribe: (() => void) | null = null;
  private currentOnChunk: ((chunk: string) => void) | undefined;

  constructor(session: any, options: PiEngineOptions) {
    this.session = session;
    this.options = options;
    this.currentOnChunk = options.onChunk;
  }

  get isIdle(): boolean {
    // AgentSession.isIdle 是 getter 属性（非方法），兼容两种形态。
    return typeof this.session.isIdle === 'function' ? this.session.isIdle() : !!this.session.isIdle;
  }

  /** 订阅事件流：assistant 文本增量 → onChunk；所有事件 → auditHook。 */
  start(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.session.subscribe((event: any) => {
      if (this.currentOnChunk) {
        const chunk = textFromEvent(event);
        if (chunk) this.currentOnChunk(chunk);
      }
      if (this.options.auditHook) void this.options.auditHook(event);
    });
  }

  /**
   * AgentRuntime.run 兼容签名（drop-in）：
   * run(userInput, mode, onChunk, model, renderer)
   * 忽略 mode/model（模型在引擎创建时固定）；onChunk 每次调用重新绑定。
   */
  async run(
    userInput: string,
    _mode?: 'chat' | 'command',
    onChunk?: (chunk: string) => void,
    _model?: string,
    _renderer?: unknown
  ): Promise<void> {
    if (onChunk) this.currentOnChunk = onChunk;
    this.start();
    await this.session.prompt(userInput);
    // 无渲染器（一次性问答 / 管道输出）：把最终回答打到 stdout
    if (!onChunk) {
      const lastText = lastAssistantText(this.session.messages);
      if (lastText) console.log(lastText);
    }
  }

  async steer(text: string): Promise<void> {
    await this.session.steer(text);
  }

  async abort(): Promise<void> {
    await this.session.abort();
  }

  getContextUsagePercent(): number | undefined {
    return this.session.getContextUsage()?.percent;
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}

/** 剥离 aiproxy 注入的 [opencode] 前缀（与 yuangs 原 ai/client 一致）。 */
function stripProxyPrefix(text: string): string {
  return text.replace(/^\[opencode\]\s*/, '');
}

/** 从 session 消息历史中提取最后一条 assistant 的纯文本（跳过 thinking 块）。 */
function lastAssistantText(messages: any[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message || message.role !== 'assistant') continue;
    const content = message.content;
    if (!Array.isArray(content)) return undefined;
    const text = content
      .filter((b: any) => b.type === 'text' && typeof b.text === 'string')
      .map((b: any) => b.text)
      .join('');
    return stripProxyPrefix(text) || undefined;
  }
  return undefined;
}

/** 从 session 事件中提取 assistant 文本增量（流式渲染用）。 */
function textFromEvent(event: any): string | undefined {
  if (event.type !== 'message_update') return undefined;
  const message = event.message;
  if (!message || message.role !== 'assistant') return undefined;
  const content = message.content;
  if (!Array.isArray(content)) return undefined;
  // 只取纯文本块；delta 事件可能携带新增文本
  const text = content
    .filter((b: any) => b.type === 'text' && typeof b.text === 'string')
    .map((b: any) => b.text)
    .join('');
  return stripProxyPrefix(text) || undefined;
}

// ─── 5. 顶层便捷函数：一步建会话 ───

/**
 * pi 没有、需要从 yuangs 保留的工具名。其余 yuangs 工具均可被 pi 内置覆盖。
 */
export const YUANGS_ONLY_TOOL_NAMES = ['analyze_dependencies'];

/**
 * 一条命令集成：
 *   const engine = await PiEngine.create();
 *   const ps = await engine.createSession({ yuangsTools: getYuangsTools(), onChunk, auditHook });
 *   await ps.run(userInput);
 *   ps.dispose();
 */
export async function createPiSession(options: PiEngineOptions): Promise<PiSession> {
  const engine = await PiEngine.create({ modelId: options.modelId });
  return engine.createSession(options);
}

/** AgentRuntime.run 的兼容签名（pi 引擎与旧引擎的最小公共接口）。 */
export type EngineRun = (
  userInput: string,
  mode?: 'chat' | 'command',
  onChunk?: (chunk: string) => void,
  model?: string,
  renderer?: StreamMarkdownRenderer
) => Promise<void>;

/**
 * 引擎工厂：优先 pi 引擎（Route A），失败回退 AgentRuntime。
 * 供 handleAIChat / cli.ts 一次性问答共用。
 */
export async function createEngineWithFallback(
  options: PiEngineOptions
): Promise<{ run: EngineRun; dispose?: () => void }> {
  try {
    return await createPiSession(options);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(chalk.yellow(`\n⚠️  pi 引擎不可用 (${msg})，回退 AgentRuntime`));
    const { AgentRuntime } = await import('./AgentRuntime');
    const { getConversationHistory } = await import('../ai/client');
    return new AgentRuntime(getConversationHistory());
  }
}
