import { ContextManager } from '../../../src/agent/contextManager';

/**
 * ContextManager 构造函数：历史加载。
 * 覆盖第 9 轮修复——调用方传 getConversationHistory() 返回的数组，构造函数需识别并加载。
 */
describe('ContextManager constructor (history loading)', () => {
  it('无参数时消息为空', () => {
    const cm = new ContextManager();
    expect(cm.getMessages()).toEqual([]);
  });

  it('直接传入历史数组时正确加载（修复 getConversationHistory 数组错配）', () => {
    const history = [
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2' }
    ] as any;

    const cm = new ContextManager(history);
    const msgs = cm.getMessages();

    expect(msgs).toHaveLength(3);
    expect(msgs[0]).toEqual({ role: 'user', content: 'q1' });
    expect(msgs[1]).toEqual({ role: 'assistant', content: 'a1' });
    expect(msgs[2]).toEqual({ role: 'user', content: 'q2' });
  });

  it('GovernanceContext 形态仍正常工作（向后兼容：history + input）', () => {
    const cm = new ContextManager({
      input: 'hello',
      mode: 'chat',
      history: [{ role: 'user', content: 'past' }]
    } as any);

    const msgs = cm.getMessages();
    expect(msgs.some(m => m.content === 'past')).toBe(true);
    expect(msgs.some(m => m.role === 'user' && m.content === 'hello')).toBe(true);
  });

  it('空数组与无参数等价（消息为空）', () => {
    const cm = new ContextManager([] as any);
    expect(cm.getMessages()).toEqual([]);
  });
});
