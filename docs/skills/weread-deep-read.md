---
name: weread-deep-read
description: 微信读书深度导读——给定一本书，获取章节目录骨架 + 热门划线 + 读者对划线的深度思考，按原书章节组织成一篇深度文章。当用户说"深度导读《书名》""帮我精读 X""深入分析这本书"时触发。
triggers:
  - 深度导读.*
  - 精读.*
  - 深入分析.*这本书
  - weread.*deep.*read
allowedTools:
  - shell_cmd
  - read_file
  - write_file
model: deepseek-v4-pro
maxTurns: 20
---

# 微信读书深度导读

## 概述

给定一本书，以原始章节目录为骨架，填充热门划线金句 + 读者对金句的深度思考，生成一篇「原书精华导读」。

## 执行流程

### Phase 1：解析输入

从用户消息中提取书名：
- "深度导读《三体》" → 书名：三体
- "帮我精读流浪地球" → 书名：流浪地球
- "深入分析这本书" → 使用上次搜索到的书

不要追问用户，直接从对话提取。

### Phase 2：执行脚本

```bash
export WEREAD_API_KEY=<环境变量>
python3 docs/skills/scripts_deep_read.py \
  --book-title "<书名>" \
  --output /tmp/weread_deep_<书名>_$(date +%Y%m%d).md
```

如果已有准确 bookId，也可以直接传 `--book-id` 跳过搜索步骤。

### Phase 3：输出内容结构

生成的 Markdown 文章包含：

1. **书籍信息**：书名、作者、评分、简介
2. **章节目录骨架**：按原书章节顺序排列
3. **热门划线**：每条金句带标注人数
4. **读者思考**：选登有深度的读者评论/想法

### Phase 4：交付报告

回复用户时给出：
- 文章保存路径
- 涵盖章节数 / 划线条数 / 读者思考条数
- 一句话评价这本书的精华密度
