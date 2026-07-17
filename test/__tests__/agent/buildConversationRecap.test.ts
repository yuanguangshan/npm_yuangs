import { buildConversationRecap } from '../../../src/agent/LLMCaller';

/**
 * buildConversationRecap：多轮对话记忆回顾。
 *
 * 背景：LLMCaller.call 原先每轮只发「文件上下文 + 当前问题」，模型拿不到前几轮对话。
 * 本函数把最近 user/assistant 轮次整理成回顾，作为 system 消息注入。
 */
describe('buildConversationRecap', () => {
  it('无对话历史时返回 null', () => {
    expect(buildConversationRecap([], '你好')).toBeNull();
  });

  it('只有当前输入时返回 null（不重复当前问题）', () => {
    expect(buildConversationRecap([{ role: 'user', content: '你好' }], '你好')).toBeNull();
  });

  it('把前几轮 user/assistant 组装成回顾，并排除当前输入', () => {
    const msgs = [
      { role: 'user', content: '什么是闭包' },
      { role: 'assistant', content: '闭包是…' },
      { role: 'user', content: '继续' } // 当前输入
    ];
    const recap = buildConversationRecap(msgs, '继续');
    expect(recap).not.toBeNull();
    expect(recap!).toContain('[之前的对话]');
    expect(recap!).toContain('用户: 什么是闭包');
    expect(recap!).toContain('AI: 闭包是…');
    // 当前输入不出现
    expect(recap!).not.toContain('继续');
  });

  it('过滤掉 tool / system 等非对话消息', () => {
    const msgs = [
      { role: 'user', content: 'q1' },
      { role: 'tool', content: 'some tool output' },
      { role: 'system', content: 'some observation' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2' }
    ];
    const recap = buildConversationRecap(msgs, 'q2');
    expect(recap).toContain('用户: q1');
    expect(recap).toContain('AI: a1');
    expect(recap).not.toContain('tool output');
    expect(recap).not.toContain('observation');
  });

  it('超过 maxMsgs 时只保留最近的几条', () => {
    const msgs = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `m${i}` }));
    // 当前输入设为不存在的值，让全部 10 条都参与；maxMsgs=6 → 只留后 6 条
    const recap = buildConversationRecap(msgs, '__current__', 6);
    expect(recap).toContain('m9');
    expect(recap).toContain('m4'); // 后 6 条：m4..m9
    expect(recap).not.toContain('m3');
  });

  it('对超长消息按 maxChars 截断', () => {
    const long = 'x'.repeat(1000);
    const recap = buildConversationRecap(
      [{ role: 'user', content: long }],
      '__current__',
      6,
      50
    );
    // 截断到 50 字符 + 省略号
    expect(recap).toContain('…');
    expect(recap!.length).toBeLessThan(long.length);
  });
});
