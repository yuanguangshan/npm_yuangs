---
name: search-news
description: 通过 Google News RSS 搜索最新新闻（绕过 web_search 网络限制）
---
# search-news — Google News RSS 搜索

当 `web_search` / `web_fetch` 工具不可用时，通过 Google News RSS feed 搜索新闻。

## 用法

调用时传入搜索关键词（支持中文），例如：
- "ima 腾讯"
- "DeepSeek R2"
- "AI Agent 最新进展"

## 实现

1. 对关键词做 URL 编码（中文 → URL 编码）
2. 用 `run_command` 执行 curl 获取 RSS XML：

```bash
curl -sL "https://news.google.com/rss/search?q=<关键词URL编码>&hl=zh-CN&gl=CN&ceid=CN:zh-Hans" \
  -H "User-Agent: Mozilla/5.0"
```

3. 从 RSS XML 中解析 `<item>` 元素：
   - `<title>` — 新闻标题
   - `<source>` — 来源媒体
   - `<pubDate>` — 发布时间
   - `<link>` — 原文链接（Google News 跳转）

4. 按发布时间排序，取前 10-15 条结果
5. 用表格或列表呈现给用户

## 限制

- 结果来自 Google News，时效性好但可能遗漏小众来源
- RSS 只返回标题+来源+时间，不包含正文摘要
- 如需正文内容，可用 `web_fetch`（如果可用）或通过 `link` 中的 Google News 跳转链获取
