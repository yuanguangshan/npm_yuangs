import { LLMAdapter } from '../../../src/agent/llmAdapter';

/**
 * parseThought 行为单测（纯函数，无需网络）。
 *
 * 重点覆盖：弱模型把"工具名"误填为 action_type（如 "action_type":"search_in_files"）
 * 等非法值时，必须兜底为合理的 answer/tool_call，避免把"本应直接回答"拖入工具死循环。
 */
describe('LLMAdapter.parseThought', () => {
  const parse = (raw: string) => LLMAdapter.parseThought(raw);
  const payloadOf = (t: ReturnType<typeof parse>) => t.payload as Record<string, unknown>;

  describe('非法 action_type 兜底', () => {
    it('把工具名当 action_type 且带 tool_name → 校正为 tool_call，继续循环', () => {
      const raw = '{"action_type":"search_in_files","tool_name":"search_in_files","parameters":{"pattern":"linux"},"risk_level":"low"}';
      const t = parse(raw);
      expect(t.type).toBe('tool_call');
      expect(t.isDone).toBe(false);
      expect(payloadOf(t).tool_name).toBe('search_in_files');
    });

    it('非法 action_type 且无任何工具线索 → 兜底为 answer，直接结束', () => {
      const raw = '{"action_type":"search_in_files","content":"hello"}';
      const t = parse(raw);
      expect(t.type).toBe('answer');
      expect(t.isDone).toBe(true);
      expect(payloadOf(t).content).toBe('hello');
    });

    it('is_done:true + 非法 action_type → 优先短路为 answer', () => {
      const raw = '{"action_type":"search_in_files","is_done":true,"content":"done"}';
      const t = parse(raw);
      expect(t.type).toBe('answer');
      expect(t.isDone).toBe(true);
    });
  });

  describe('合法但语义矛盾兜底', () => {
    it('action_type=tool_call 但 tool_name 缺失 → 兜底为 answer', () => {
      const raw = '{"action_type":"tool_call","parameters":{}}';
      const t = parse(raw);
      expect(t.type).toBe('answer');
      expect(t.isDone).toBe(true);
    });

    it('action_type=shell_cmd 但 command 缺失 → 兜底为 answer', () => {
      const raw = '{"action_type":"shell_cmd","risk_level":"low"}';
      const t = parse(raw);
      expect(t.type).toBe('answer');
      expect(t.isDone).toBe(true);
    });
  });

  describe('正向回归（合法输入语义不变）', () => {
    it('answer + content + is_done → 直接结束', () => {
      const raw = '{"action_type":"answer","content":"Linux 是开源内核...","is_done":true,"risk_level":"low"}';
      const t = parse(raw);
      expect(t.type).toBe('answer');
      expect(t.isDone).toBe(true);
      expect(payloadOf(t).content).toBe('Linux 是开源内核...');
    });

    it('tool_call + tool_name → 继续工具循环', () => {
      const raw = '{"action_type":"tool_call","tool_name":"read_file","parameters":{"path":"a.ts"},"risk_level":"low"}';
      const t = parse(raw);
      expect(t.type).toBe('tool_call');
      expect(t.isDone).toBe(false);
      expect(payloadOf(t).tool_name).toBe('read_file');
    });

    it('shell_cmd + command → 继续工具循环', () => {
      const raw = '{"action_type":"shell_cmd","command":"ls -la","risk_level":"low"}';
      const t = parse(raw);
      expect(t.type).toBe('shell_cmd');
      expect(t.isDone).toBe(false);
      expect(payloadOf(t).command).toBe('ls -la');
    });
  });

  describe('解析失败兜底', () => {
    it('纯文本无 JSON → 作为 answer 返回原文', () => {
      const raw = '这是一段没有 JSON 的纯文本回答';
      const t = parse(raw);
      expect(t.type).toBe('answer');
      expect(t.isDone).toBe(true);
      expect(payloadOf(t).content).toBe(raw);
    });
  });
});
