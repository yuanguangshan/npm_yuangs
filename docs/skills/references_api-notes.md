# 微信读书 API 调用关键笔记

## 基础

- **Gateway**：`POST https://i.weread.qq.com/api/agent/gateway`
- **认证**：`Authorization: Bearer $WEREAD_API_KEY`
- **必带字段**：`skill_version: "1.0.3"`（缺这个会鉴权失败）

## 关键坑位（已踩过）

### 1. params 必须平铺，不要嵌套

❌ 错误：
```json
{"api_name":"/book/info","params":{"bookId":"xxx"},"skill_version":"1.0.3"}
```
报错：`errcode:-2003 缺少必填参数 bookId`

✅ 正确：
```json
{"api_name":"/book/info","bookId":"xxx","skill_version":"1.0.3"}
```

所有接口（`/store/search`、`/book/info`、`/review/list`）都遵守此规则。

### 2. WEREAD_API_KEY 不自动注入

新 shell 必须 `export WEREAD_API_KEY=...`，否则脚本会退出。

Key 在 memory 里查（`memory_recall` 关键词 `WEREAD_API_KEY`）。

### 3. 用 curl 不用 urllib

Python urllib 调用此 API 偶发 SSL 握手错误。脚本里用 `subprocess` 调 curl 更稳。

## 调用模板

```bash
curl -sS -X POST https://i.weread.qq.com/api/agent/gateway \
  -H "Authorization: Bearer $WEREAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api_name":"/store/search","keyword":"大模型","scope":10,"count":20,"skill_version":"1.0.3"}'
```

## 字段速查

### /store/search 返回（scope=10 电子书）

- `results[0].books[].bookInfo.bookId` — 书 ID
- `results[0].books[].bookInfo.title` — 书名
- `results[0].books[].bookInfo.author` — 作者
- `results[0].books[].bookInfo.intro` — 简介
- `results[0].books[].newRating` — 评分（0-1000，需 /10 显示为百分制）
- `results[0].books[].newRatingCount` — 评分人数
- `results[0].books[].newRatingDetail.title` — 评分标签（"神作"/"好评如潮"等）
- `results[0].books[].readingCount` — 在读人数

注：search 返回的 `newRating` 是 0-1000 范围（如 916 = 91.6 分），别忘 /10。

### /book/info 返回

- `title` / `author` / `translator` / `publisher` / `publishTime`
- `intro` — 详细简介
- `newRating` — 评分（百分制 0-100，如 91.6）
- `newRatingCount` — 评分人数
- `category` — 分类

注：book/info 的 `newRating` 是百分制小数（如 91.6），直接显示即可。

### /review/list 返回（reviewListType=1 推荐）

- `reviews[].review.review.content` — 评论正文
- `reviews[].review.review.star` — 星级（20/40/60/80/100）
- `reviews[].review.review.author.name` — 评论者昵称
- `reviews[].review.review.isFinish` — 是否读完
- `deepVRecommendInfo.subtitle` — 资深会员推荐比例文本

## 评论筛选优先级

挑"优质评论"时按以下优先级：

1. **读完 + 五星**（`isFinish=true` 且 `star=100`）—— 最高质量
2. **内容长度 >= 80 字**（避免"好书"这种水评）
3. **避免纯表情/纯感叹**
4. **首选已是 reviewListType=1 推荐池里的**
