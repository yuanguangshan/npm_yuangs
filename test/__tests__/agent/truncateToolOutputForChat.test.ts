import { truncateToolOutputForChat, wrapAsCodeFence } from '../../../src/agent/ExecutionStabilizer';

/**
 * truncateToolOutputForChat：chat 模式工具结果（如 read_file）的行级截断。
 * 取代旧的 1000 字符硬截断——既更宽容（按终端高度约 2 屏），又避免按码元切片切断中文。
 */
describe('truncateToolOutputForChat', () => {
  it('短输出原样返回（不超过限制）', () => {
    const out = '第一行\n第二行\n第三行';
    expect(truncateToolOutputForChat(out, 10)).toBe(out);
  });

  it('超过限制时按整行截断，并附带总行数与已显示行数提示', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`);
    const out = lines.join('\n');
    const result = truncateToolOutputForChat(out, 10);
    // 保留前 10 行（line 1..line 10），不包含 line 11
    expect(result.startsWith('line 1\nline 2\nline 3')).toBe(true);
    expect(result).toContain('line 10');
    expect(result).not.toContain('line 11');
    // 提示信息
    expect(result).toContain('共 50 行');
    expect(result).toContain('已显示前 10 行');
  });

  it('不会切断多字节字符（按整行切，非按码元）', () => {
    // 每行一个中文 emoji（代理对）；按码元 slice 可能切断，按行不会
    const lines = Array.from({ length: 30 }, () => '😀测试行');
    const out = lines.join('\n');
    const result = truncateToolOutputForChat(out, 5);
    // 截断后最后一行仍是完整 emoji，无乱码代理对
    const shown = result.split('\n')[4];
    expect(shown).toBe('😀测试行');
  });

  it('行数等于限制时不截断（边界）', () => {
    const out = Array.from({ length: 10 }, (_, i) => `l${i}`).join('\n');
    expect(truncateToolOutputForChat(out, 10)).toBe(out);
  });

  it('默认 maxLines 自适应终端高度（不传参时仍工作）', () => {
    const out = Array.from({ length: 200 }, (_, i) => `l${i}`).join('\n');
    const result = truncateToolOutputForChat(out); // 默认约 2 屏
    expect(result).toContain('共 200 行');
    expect(result.split('\n').length).toBeLessThan(200);
  });
});

describe('wrapAsCodeFence', () => {
  it('用 3 反引号围栏包裹普通内容', () => {
    expect(wrapAsCodeFence('hello\nworld')).toBe('```\nhello\nworld\n```');
  });

  it('内容含 ``` 时自动加长围栏，避免被内容截断', () => {
    const content = 'before\n```\nnested\n```\nafter';
    const wrapped = wrapAsCodeFence(content);
    // 外层围栏应为 4 个反引号（比内容里最长的 3 长 1）
    expect(wrapped.startsWith('````\n')).toBe(true);
    expect(wrapped.endsWith('\n````')).toBe(true);
    // 内部 3 反引号围栏原样保留
    expect(wrapped).toContain('```\nnested\n```');
  });

  it('空内容也能正常包裹', () => {
    expect(wrapAsCodeFence('')).toBe('```\n\n```');
  });
});
