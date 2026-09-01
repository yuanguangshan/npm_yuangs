import {
    CONTEXT_BUDGET,
    MAX_ASSISTANT_STORE,
    buildSendMessages,
    estimateChars,
    isServerError,
    truncateForStore,
} from '../../../src/commands/handleAIChat';

// role 用宽泛类型，避免与 AIRequestMessage 的联合类型产生摩擦
const msg = (role: string, content: string): any => ({ role, content });

describe('isServerError — 5xx 判定（direct 通道重试依据）', () => {
    it('识别 axios response.status 形式的 5xx', () => {
        expect(isServerError({ response: { status: 500 } })).toBe(true);
        expect(isServerError({ response: { status: 502 } })).toBe(true);
        expect(isServerError({ response: { status: 503 } })).toBe(true);
    });

    it('识别 "Request failed with status code 5xx" 文本形式', () => {
        expect(isServerError(new Error('Request failed with status code 502'))).toBe(true);
        expect(isServerError(new Error('Request failed with status code 503'))).toBe(true);
    });

    it('4xx / 普通错误 / 空值不触发重试', () => {
        expect(isServerError({ response: { status: 400 } })).toBe(false);
        expect(isServerError({ response: { status: 401 } })).toBe(false);
        expect(isServerError(new Error('Request failed with status code 400'))).toBe(false);
        expect(isServerError(new Error('ECONNRESET'))).toBe(false);
        expect(isServerError(null)).toBe(false);
        expect(isServerError(undefined)).toBe(false);
        expect(isServerError({})).toBe(false);
    });
});

describe('buildSendMessages — 上下文预算裁剪', () => {
    it('未超预算时原样返回，不丢消息', () => {
        const msgs = [msg('user', 'hi'), msg('assistant', 'hello'), msg('user', 'again')];
        expect(buildSendMessages(msgs)).toEqual(msgs);
    });

    it('单条超过 perMsgCap 时截断并加标记', () => {
        const long = 'x'.repeat(CONTEXT_BUDGET.normal.perMsgCap + 500);
        const out = buildSendMessages([msg('user', long)]);
        expect(out).toHaveLength(1);
        expect(out[0].content).toContain('[... 上下文过长已截断 ...]');
        expect(out[0].content.length).toBeLessThan(long.length);
    });

    it('总预算超限时从最旧的消息开始丢弃', () => {
        // 7 条 × 3000 字符 = 21000 > normal.totalBudget(18000)，需丢弃最旧的
        const msgs = Array.from({ length: 7 }, (_, i) =>
            msg(i % 2 === 0 ? 'user' : 'assistant', `m${i}`.padEnd(3000, 'x'))
        );
        const out = buildSendMessages(msgs);
        expect(out.length).toBeLessThan(msgs.length);
        // 最旧的 m0 应被丢掉，保留下来的第一条是 m1
        expect(out[0].content.startsWith('m1')).toBe(true);
        expect(estimateChars(out)).toBeLessThanOrEqual(CONTEXT_BUDGET.normal.totalBudget);
    });

    it('始终至少保留最后一条 user（裁剪不会清空消息）', () => {
        const huge = 'z'.repeat(10000);
        const msgs = [
            msg('assistant', huge),
            msg('user', huge),
            msg('assistant', huge),
            msg('user', huge),
            msg('assistant', huge),
            msg('user', 'final question'),
        ];
        const out = buildSendMessages(msgs);
        expect(out.length).toBeGreaterThanOrEqual(1);
        // 最后一条（最新的 user）必须存活
        expect(out[out.length - 1].role).toBe('user');
        expect(out[out.length - 1].content).toBe('final question');
    });

    it('aggressive 档预算更紧，5xx 重试时进一步精简', () => {
        const content = 'a'.repeat(3000);
        const msgs = [msg('assistant', content), msg('user', content), msg('assistant', content)];
        const normal = buildSendMessages(msgs, false);
        const aggressive = buildSendMessages(msgs, true);
        expect(estimateChars(aggressive)).toBeLessThan(estimateChars(normal));
        expect(aggressive.length).toBeLessThanOrEqual(normal.length);
    });
});

describe('estimateChars', () => {
    it('累加各条 content 长度，忽略非字符串', () => {
        expect(estimateChars([msg('user', 'abcd'), msg('assistant', 'ef')])).toBe(6);
        expect(estimateChars([{ role: 'user', content: undefined } as any])).toBe(0);
        expect(estimateChars([])).toBe(0);
    });
});

describe('truncateForStore — 写入历史前的硬截断', () => {
    it('短文本原样返回', () => {
        const s = 'short answer';
        expect(truncateForStore(s)).toBe(s);
    });

    it('超长回复截断到 MAX_ASSISTANT_STORE 并加省略标记', () => {
        const long = 'L'.repeat(MAX_ASSISTANT_STORE + 2000);
        const out = truncateForStore(long);
        expect(out.length).toBeLessThan(long.length);
        expect(out.startsWith('L'.repeat(MAX_ASSISTANT_STORE))).toBe(true);
        expect(out).toContain('[... 上文过长已在上下文中省略 ...]');
    });

    it('恰好等于上限时不截断', () => {
        const exact = 'E'.repeat(MAX_ASSISTANT_STORE);
        expect(truncateForStore(exact)).toBe(exact);
    });
});
