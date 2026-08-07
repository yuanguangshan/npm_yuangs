"use strict";
/**
 * aiproxyAdapter.ts — aiproxy（opencode 风格）非标准文本工具协议适配
 *
 * aiproxy 不返回标准 tool_calls 字段，而是在响应文本里嵌入：
 *   <toolcall>\n{"name":"...","arguments":{...}}\n</toolcall>
 * 工具结果需以下一轮 user 消息回传：
 *   <toolresult>\n<result>\n...\n</result>\n</toolresult>
 * 本模块实现自定义 streamSimple：非流式请求 + 解析三种响应形状（标准 tool_calls / <toolcall> 文本 / 纯文本）。
 * 仅当 YUANGS_USE_AI_PROXY=1 时被 piSession 使用；默认端点（DeepSeek/opencode 官方）无需本模块。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamOpencode = streamOpencode;
const client_1 = require("../ai/client");
const TOOLCALL_RE = /<toolcall>\s*(\{[\s\S]*?\})\s*<\/toolcall>/g;
function extractToolCalls(text) {
    const calls = [];
    for (const match of text.matchAll(TOOLCALL_RE)) {
        try {
            const parsed = JSON.parse(match[1]);
            calls.push({ name: String(parsed.name ?? ''), arguments: parsed.arguments ?? {} });
        }
        catch {
            // 解析失败跳过该块
        }
    }
    return calls;
}
function stripToolCalls(text) {
    return text.replace(/<toolcall>\s*\{[\s\S]*?\}\s*<\/toolcall>/g, '').trim();
}
/** 把 pi 消息翻译成 opencode 文本协议消息。 */
function translateToOpencodeMessages(messages) {
    const out = [];
    let pendingToolResults = [];
    const flushToolResults = () => {
        if (pendingToolResults.length === 0)
            return;
        out.push({ role: 'user', content: pendingToolResults.join('\n') });
        pendingToolResults = [];
    };
    for (const message of messages) {
        if (!message || typeof message !== 'object') {
            // 防御：跳过坏消息（历史兼容/手改会话可能残留空槽）
            continue;
        }
        const role = message.role;
        if (role === 'toolResult') {
            const text = (message.content ?? [])
                .filter((b) => b.type === 'text' && typeof b.text === 'string')
                .map((b) => b.text)
                .join('\n');
            pendingToolResults.push(`<toolresult>\n<result>\n${text}\n</result>\n</toolresult>`);
            continue;
        }
        flushToolResults();
        if (role === 'user' || role === 'assistant') {
            const parts = [];
            for (const block of message.content ?? []) {
                if (block.type === 'text' && typeof block.text === 'string')
                    parts.push(block.text);
                else if (block.type === 'toolCall') {
                    parts.push(`<toolcall>\n${JSON.stringify({ name: block.name, arguments: block.arguments })}\n</toolcall>`);
                }
            }
            out.push({ role, content: parts.join('\n') });
        }
    }
    flushToolResults();
    return out;
}
/** 简易事件流：先收集事件，异步迭代器再逐个产出（非流式场景足够）。
 * result() 返回一个 promise，直到 end() 被调用才 resolve——
 * 避免 lazyStream 转发与消费方调用 result() 之间的竞态。 */
class SimpleEventStream {
    events = [];
    endPromise;
    resolveEnd;
    constructor() {
        this.endPromise = new Promise((resolve) => {
            this.resolveEnd = resolve;
        });
    }
    push(event) {
        this.events.push(event);
    }
    end(message) {
        this.resolveEnd(message);
    }
    async *[Symbol.asyncIterator]() {
        for (const event of this.events)
            yield event;
    }
    async result() {
        return this.endPromise;
    }
}
function buildAssistantMessage(model, contentBlocks, stopReason, usage) {
    return {
        role: 'assistant',
        content: contentBlocks,
        api: model.api,
        provider: model.provider,
        model: model.id,
        usage: usage ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 },
        stopReason,
        timestamp: Date.now(),
    };
}
async function streamOpencode(model, context, options) {
    const stream = new SimpleEventStream();
    const apiKey = options?.apiKey ?? process.env.YUANGS_AI_API_KEY ?? 'sk-frontend';
    const baseUrl = model.baseUrl ?? 'https://aiproxy.want.biz/v1';
    const svcCfg = (0, client_1.getUserConfig)();
    const tools = (context.tools ?? []).map((tool) => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description ?? '',
            parameters: tool.parameters ?? { type: 'object', properties: {} },
        },
    }));
    const requestBody = {
        model: model.id,
        messages: translateToOpencodeMessages(context.messages),
        stream: false,
    };
    if (tools.length > 0)
        requestBody.tools = tools;
    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'X-Client-ID': 'npm_yuangs',
                Origin: 'https://cli.want.biz',
                Referer: 'https://cli.want.biz/',
                account: svcCfg.accountType ?? '',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
                Accept: 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: options?.signal ?? undefined,
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`${response.status}: ${body.slice(0, 300)}`);
        }
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content ?? '';
        // 代理后端不固定：可能返回文本 / 标准 tool_calls 字段 / <toolcall> 文本标记，三种都要处理
        const textToolCalls = extractToolCalls(rawContent);
        const stdToolCalls = [];
        for (const tc of data.choices?.[0]?.message?.tool_calls ?? []) {
            let parsedArgs = {};
            try {
                parsedArgs = JSON.parse(tc.function?.arguments ?? '{}');
            }
            catch {
                parsedArgs = {};
            }
            stdToolCalls.push({ id: tc.id, name: String(tc.function?.name ?? ''), arguments: parsedArgs });
        }
        const allCalls = [
            ...stdToolCalls,
            ...textToolCalls.map((call) => ({ name: call.name, arguments: call.arguments })),
        ];
        const usage = data.usage
            ? {
                input: data.usage.prompt_tokens ?? 0,
                output: data.usage.completion_tokens ?? 0,
                cacheRead: 0,
                cacheWrite: 0,
                totalTokens: data.usage.total_tokens ?? 0,
            }
            : undefined;
        const toolCalls = extractToolCalls(rawContent);
        const text = stripToolCalls(rawContent);
        const contentBlocks = [];
        if (text)
            contentBlocks.push({ type: 'text', text });
        const toolCallBlocks = allCalls.map((call) => ({
            type: 'toolCall',
            id: call.id ?? `call_${Math.random().toString(36).slice(2, 12)}`,
            name: call.name,
            arguments: call.arguments,
        }));
        contentBlocks.push(...toolCallBlocks);
        const stopReason = toolCallBlocks.length > 0 ? 'toolUse' : 'stop';
        const finalMessage = buildAssistantMessage(model, contentBlocks, stopReason, usage);
        // 事件序列（先 start，再文本增量，再工具调用，最后 done）
        stream.push({ type: 'start', partial: buildAssistantMessage(model, [], 'stop', usage) });
        if (text) {
            stream.push({ type: 'text_start', contentIndex: 0, partial: finalMessage });
            stream.push({ type: 'text_delta', contentIndex: 0, delta: text, partial: finalMessage });
            stream.push({ type: 'text_end', contentIndex: 0, partial: finalMessage });
        }
        for (const block of toolCallBlocks) {
            stream.push({
                type: 'toolcall_start',
                contentIndex: contentBlocks.indexOf(block),
                partial: finalMessage,
            });
            stream.push({
                type: 'toolcall_delta',
                contentIndex: contentBlocks.indexOf(block),
                delta: JSON.stringify(block.arguments),
                partial: finalMessage,
            });
            stream.push({ type: 'toolcall_end', contentIndex: contentBlocks.indexOf(block), toolCall: block, partial: finalMessage });
        }
        // done 事件必须携带 message（EventStream 从 event.message 提取最终结果）
        stream.push({ type: 'done', message: finalMessage, partial: finalMessage });
        stream.end(finalMessage);
    }
    catch (error) {
        const message = buildAssistantMessage(model, [], 'error', { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 });
        message.errorMessage = error instanceof Error ? error.message : String(error);
        stream.push({ type: 'error', reason: 'error', error: message });
        stream.end(message);
    }
    return stream;
}
//# sourceMappingURL=aiproxyAdapter.js.map