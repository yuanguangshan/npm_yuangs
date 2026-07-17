import { extractStreamableContent } from '../../../src/agent/llm';

/**
 * extractStreamableContent 是流式渲染去 JSON 化的核心：
 * 从逐批累积的 Agent JSON 响应里，安全地增量提取 content 正文，保证终端只流式显示
 * 回答正文，而不显示 {"action_type":"answer",...} 这类 JSON 语法。
 *
 * 关键不变量：
 * - 单次返回值是“截至当前 raw 为止已确定”的正文前缀；随 raw 增长只增不减。
 * - 永不吐出半截转义序列或闭合引号（边界安全）。
 * - 找不到正文字段时返回 null（调用方保持等待态）。
 */
describe('extractStreamableContent', () => {
  it('完整 JSON 一次性给出时，提取 content 正文', () => {
    const raw = '{"action_type":"answer","content":"你好，世界","is_done":true}';
    expect(extractStreamableContent(raw)).toBe('你好，世界');
  });

  it('尚未出现 content 字段时返回 null（保持等待态）', () => {
    expect(extractStreamableContent('{"action_type":"answer",')).toBeNull();
    expect(extractStreamableContent('')).toBeNull();
  });

  it('冒号后、引号未到达时返回空串（已定位字段，等待值）', () => {
    expect(extractStreamableContent('{"action_type":"answer","content":')).toBe('');
    expect(extractStreamableContent('{"action_type":"answer","content": ')).toBe('');
  });

  it('content 字段值非字符串（如 null）时跳过，不误吐', () => {
    expect(extractStreamableContent('{"action_type":"answer","content":null,"text":"备用"}')).toBe('备用');
  });

  it('逐批累积时，返回值是单调增长的正文前缀（模拟 token 流）', () => {
    // 模拟模型按 token 流式输出
    const tokens = [
      '{"action_type":"answer","content":"',
      'Linux ',
      '是一个',
      '开源',
      '操作系统',
      '。","is_done":true}',
    ];
    let raw = '';
    const seen: string[] = [];
    for (const t of tokens) {
      raw += t;
      const c = extractStreamableContent(raw);
      seen.push(c ?? '');
    }
    // 每一步都应是已确定正文的前缀，且单调不减；最后一步包含闭合引号前的句号
    expect(seen).toEqual(['', 'Linux ', 'Linux 是一个', 'Linux 是一个开源', 'Linux 是一个开源操作系统', 'Linux 是一个开源操作系统。']);
  });

  it('正确解码 JSON 转义（换行/引号/反斜杠）', () => {
    const raw = '{"content":"行1\\n行2\\t制表\\\"引号\\\\斜杠"}';
    expect(extractStreamableContent(raw)).toBe('行1\n行2\t制表"引号\\斜杠');
  });

  it('转义序列被截断时停在安全边界，下一批补齐', () => {
    // 反斜杠刚到达，转义字符未到
    expect(extractStreamableContent('{"content":"abc\\')).toBe('abc');
    // \uXXXX 部分到达
    expect(extractStreamableContent('{"content":"abc\\u4f6')).toBe('abc');
    // 补齐后正确解码中文 你 = "你"
    expect(extractStreamableContent('{"content":"abc\\u4f60"}')).toBe('abc你');
  });

  it('识别 final_answer / text 作为正文字段（兼容弱模型字段名）', () => {
    expect(extractStreamableContent('{"final_answer":"FA正文"}')).toBe('FA正文');
    expect(extractStreamableContent('{"text":"T正文"}')).toBe('T正文');
    // content 优先于其它字段
    expect(extractStreamableContent('{"text":"T","content":"C"}')).toBe('C');
  });

  it('识别 ```json 代码块包裹的 JSON', () => {
    const raw = '```json\n{"action_type":"answer","content":"块内正文"}\n```';
    expect(extractStreamableContent(raw)).toBe('块内正文');
  });

  it('多行正文：换行原样保留，供后续 markdown 渲染', () => {
    const raw = '{"content":"## 标题\\n\\n- 条目A\\n- 条目B"}';
    expect(extractStreamableContent(raw)).toBe('## 标题\n\n- 条目A\n- 条目B');
  });
});
