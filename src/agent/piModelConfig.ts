/**
 * pi-coding-agent 模型对接配置
 *
 * 将 yuangs 的 aiProxyUrl 桥接到 pi-coding-agent 的 openai-completions provider。
 *
 * yuangs 默认使用: https://aiproxy.want.biz/v1/chat/completions
 * pi 的 openai-completions provider 接受: { baseURL, apiKey, model }
 *
 * 使用方式：
 *   import { createPiSessionConfig } from './piModelConfig';
 *   const config = createPiSessionConfig();
 *   // 传给 pi 的 createAgentSession(config)
 */

import { getConfigService } from '../core/ConfigService';

/**
 * pi AgentSession 模型配置
 */
export interface PiSessionModelConfig {
  /** 模型 provider 类型 */
  provider: 'openai-completions';
  /** API base URL（从 yuangs aiProxyUrl 转换） */
  baseURL: string;
  /** API key（如果需要） */
  apiKey?: string;
  /** 模型名称 */
  model: string;
  /** 是否启用流式输出 */
  stream?: boolean;
  /** 请求超时（毫秒） */
  timeout?: number;
}

/**
 * 从 yuangs 的 aiProxyUrl 提取 base URL。
 *
 * yuangs aiProxyUrl 格式: https://aiproxy.want.biz/v1/chat/completions
 * pi openai-completions baseURL 格式: https://aiproxy.want.biz/v1
 */
export function extractBaseUrl(aiProxyUrl: string): string {
  // 移除 /chat/completions 后缀
  let baseUrl = aiProxyUrl.replace(/\/chat\/completions\/?$/, '');
  // 确保以 /v1 结尾（如果原始 URL 包含 /v1）
  if (!baseUrl.endsWith('/v1') && aiProxyUrl.includes('/v1/')) {
    baseUrl = baseUrl.replace(/\/$/, '') + '/v1';
  }
  return baseUrl;
}

/**
 * 创建 pi AgentSession 的模型配置。
 *
 * 从 yuangs 的 ConfigService 读取 aiProxyUrl 和 defaultModel，
 * 转换为 pi-coding-agent 的 openai-completions provider 配置。
 */
export function createPiSessionConfig(): PiSessionModelConfig {
  const svc = getConfigService();
  const aiProxyUrl = svc.getAiProxyUrl();
  const defaultModel = svc.getDefaultModel();

  const baseURL = extractBaseUrl(aiProxyUrl);

  // API key 从环境变量读取（不硬编码）
  const apiKey = process.env.YUANGS_AI_API_KEY || process.env.OPENAI_API_KEY;

  return {
    provider: 'openai-completions',
    baseURL,
    apiKey,
    model: defaultModel,
    stream: true,
    timeout: 120000, // 2 分钟超时
  };
}

/**
 * 创建 pi AgentSession 的完整配置（包括工具和 governance）。
 *
 * 这个配置将 yuangs 的安全策略映射到 pi 的 governance 扩展：
 *  - confirm-destructive: 写入前确认
 *  - permission-gate: 工具调用权限检查
 *  - protected-paths: 受保护路径
 */
export function createPiFullSessionConfig(cwd: string) {
  const modelConfig = createPiSessionConfig();

  return {
    // 模型配置
    model: modelConfig,

    // 工作目录
    cwd,

    // Governance 扩展
    extensions: {
      // 确认破坏性操作（写入/删除前要求用户确认）
      'confirm-destructive': {
        enabled: true,
        // 需要确认的工具
        tools: ['write', 'edit', 'bash'],
        // 确认回调（使用 yuangs 的 confirm 工具）
        confirm: async (description: string) => {
          const { confirm } = await import('../utils/confirm');
          return confirm(description);
        },
      },

      // 权限门控
      'permission-gate': {
        enabled: true,
        // 默认策略：读取类工具自动允许，写入类工具需要确认
        defaultPolicy: 'confirm-on-destructive',
      },

      // 受保护路径
      'protected-paths': {
        enabled: true,
        // 受保护路径模式（与 governance/core.ts 的 DEFAULT_PROTECTED_PATHS 一致）
        patterns: [
          { glob: 'package.json', action: 'require-approval' },
          { glob: 'package-lock.json', action: 'require-approval' },
          { glob: '.env', action: 'deny' },
          { glob: '.env.*', action: 'deny' },
          { glob: '*.pem', action: 'deny' },
          { glob: '*.key', action: 'deny' },
          { glob: '.git/**', action: 'deny' },
          { glob: 'node_modules/**', action: 'deny' },
          { glob: 'tsconfig.json', action: 'require-approval' },
        ],
      },
    },

    // 工具配置
    tools: {
      // bash 工具配置
      bash: {
        // 允许的命令前缀（可选白名单）
        // 未配置则允许所有命令（受 governance 约束）
      },
      // 编辑工具配置
      edit: {
        // diff 上下文行数
        contextLines: 5,
      },
      // grep 工具配置
      grep: {
        // 默认结果限制
        defaultLimit: 100,
      },
    },
  };
}
