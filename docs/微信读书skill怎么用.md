# 微信读书 API 技能文档全面分析与应用场景指南

> 本文基于微信读书技能文档合集进行深度分析，系统介绍可利用的接口、应用场景、技术特点和最佳实践。

---

## 目录

1. [核心架构分析](#核心架构分析)
2. [接口体系梳理](#接口体系梳理)
3. [高价值应用场景](#高价值应用场景)
4. [关键技术实现](#关键技术实现)
5. [常见坑点与规范](#常见坑点与规范)
6. [创新功能拓展](#创新功能拓展)

---

## 一、核心架构分析

### 1.1 整体设计思路

微信读书 Skill API 采用**集中式网关 + 组件化接口**的架构：

```
┌─────────────────────────────────┐
│  Agent API Gateway              │
│  (https://i.weread.qq.com/api) │
└──────────────┬──────────────────┘
               │
        ┌──────┼──────┬──────────┬──────────────┐
        ▼      ▼      ▼          ▼              ▼
    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  ┌──────────┐
    │搜索  │ │书籍  │ │书架  │ │笔记  │  │阅读统计  │
    │模块  │ │模块  │ │模块  │ │模块  │  │&推荐模块 │
    └──────┘ └──────┘ └──────┘ └──────┘  └──────────┘
```

**核心特点**：
- ✅ 统一鉴权：基于 `WEREAD_API_KEY` 的 Bearer Token 认证
- ✅ 版本管理：每次请求必须上报 `skill_version`，支持强制升级通知
- ✅ 用户隔离：API Key 自动绑定用户身份，无需手动传 `vid`
- ✅ 深度链接：支持 WeChat App Scheme 直接打开读书内容
- ✅ 游标分页：使用基于时间戳或序号的游标，而非 offset/limit

### 1.2 数据模型核心对象

| 对象 | 说明 | 关键字段 |
|------|------|---------|
| **Book** | 电子书/出版书 | bookId, title, author, cover, rating, intro |
| **Album** | 专辑/有声书 | albumId, name, authorName, trackCount, finish |
| **Bookmark** | 划线/想法 | bookmarkId, markText, range, chapterUid, createTime |
| **Review** | 点评/评论 | reviewId, content, star, author, isFinish |
| **Progress** | 阅读进度 | chapterUid, progress(0-100%), recordReadingTime |
| **ReadData** | 阅读统计 | totalReadTime, readDays, preferCategory, rank |

---

## 二、接口体系梳理

### 2.1 完整接口清单（38 个核心接口）

#### **搜索与发现（6 个）**

| 接口 | 功能 | 核心参数 | 返回信息 |
|------|------|--------|---------|
| `/store/search` | 通用搜索 | keyword, scope(0-16), maxIdx | results[], hasMore |
| `/book/recommend` | 个性化推荐 | count, maxIdx | books[], reason, rating |
| `/book/similar` | 相似书推荐 | bookId, count, sessionId | booksimilar.books[] |
| `/_list` | 接口列表 | 无 | 所有接口定义 |

**scope 速查表**：
```python
scope_map = {
    0: "全部(综合)",
    4: "文章",
    6: "作者", 
    10: "电子书",
    12: "全文搜索",
    13: "书单",
    14: "有声书",
    16: "网文小说"
}
```

#### **书籍详情（5 个）**

| 接口 | 功能 | 用途 |
|------|------|------|
| `/book/info` | 书籍基本信息 | 获取 title, author, rating, intro, isbn |
| `/book/chapterinfo` | 章节目录 | 获取 chapters[], level(层级), wordCount |
| `/book/getprogress` | 阅读进度 | 获取 progress%, chapterUid, readTime |
| `/book/underlines` | 章节划线热度 | 获取该章每条划线的热度统计(人数/分数) |
| `/book/bestbookmarks` | 热门划线列表 | 获取全书 TOP20 热门划线 + 原文 |

#### **书架与收藏（2 个）**

| 接口 | 功能 | 关键信息 |
|------|------|---------|
| `/shelf/sync` | 书架同步 | books[], albums[], mp(文章入口) |
| N/A | 书架统计 | total = books.length + albums.length + (mp ? 1 : 0) |

#### **笔记与划线（6 个）**

| 接口 | 功能 | 输出 |
|------|------|------|
| `/user/notebooks` | 笔记本概览 | books[], totalNoteCount, sort(翻页游标) |
| `/book/bookmarklist` | 单本书划线 | updated[](划线), chapters[], markText |
| `/review/list/mine` | 个人想法点评 | reviews[], reviewId, content, star, chapterName |
| `/book/readreviews` | 划线下的想法 | pageReviews[], abstract(原文), content(想法) |
| `/review/single` | 单条想法详情 | 完整想法 + 评论 + 点赞 |
| `/review/list` | 公开点评 | 书籍的所有公开点评, reviewListType 筛选 |

#### **阅读统计（2 个）**

| 接口 | 功能 | 返回内容 |
|------|------|---------|
| `/readdata/detail` | 阅读统计详情 | totalReadTime, readDays, readLongest[], prefer* |
| N/A | 年度报告 | mode=annually 返回 yearReport[] |

#### **用户信息（1 个）**

| 接口 | 功能 |
|------|------|
| `profile.*` | 组合已有接口获取用户概况 |

### 2.2 关键参数规范

#### **必须规范**

```typescript
// ✅ 正确：业务参数平铺在顶层
{
  "api_name": "/user/notebooks",
  "count": 100,
  "lastSort": 1516907353,
  "skill_version": "1.0.5"
}

// ❌ 错误：嵌套在 params 中
{
  "api_name": "/user/notebooks",
  "params": {
    "count": 100,
    "lastSort": 1516907353
  },
  "skill_version": "1.0.5"
}
```

#### **分页游标规范**

```typescript
// 笔记本 - 使用 lastSort 时间戳游标
{
  "api_name": "/user/notebooks",
  "count": 20,
  "lastSort": 1778312777,  // 上一页最后一条的 sort 字段
  "skill_version": "1.0.5"
}

// 搜索结果 - 使用 maxIdx 和 searchIdx
{
  "api_name": "/store/search",
  "keyword": "三体",
  "scope": 10,
  "maxIdx": 2,  // 上一页最后一条的 searchIdx
  "skill_version": "1.0.5"
}

// 相似推荐 - 使用 sessionId 维持会话
{
  "api_name": "/book/similar",
  "bookId": "3300045871",
  "maxIdx": 12,  // 上一页最后一条的 idx
  "sessionId": "xxx",  // 回包中的 sessionId
  "skill_version": "1.0.5"
}
```

---

## 三、高价值应用场景

### 3.1 **个人阅读概览仪表板**

**场景**：用户想快速了解自己的阅读全景

**实现流程**：
```
1. 调 /shelf/sync → 获取书架信息
   - 计算总书籍数 = books.length + albums.length + (mp ? 1 : 0)
   - 分类统计：电子书、有声书、文章收藏
   - 公开/私密阅读分布

2. 调 /readdata/detail 获取月度统计
   mode=monthly, 获取:
   - totalReadTime (秒) → 转为 X小时Y分钟
   - readDays (有效阅读天数)
   - readLongest[] (读得最多的5本书)
   - preferCategory[] (偏好分类TOP 5)

3. 调 /book/getprogress (批量) → 获取在读书进度
   - 找出 progress 最接近 100% 的书（即将读完）
   - 找出最近阅读时间最新的书（当前在读）

4. 组织输出
```

**输出示例**：
```
📊 您的阅读概览
━━━━━━━━━━━━━━━━━━━━━━━
📚 书架总数：52 个
   ├─ 电子书：48 本
   ├─ 有声书/专辑：3 个
   └─ 文章收藏：1 个

⏱️ 本月阅读
   ├─ 阅读时长：18 小时 42 分钟
   ├─ 阅读天数：15 天
   ├─ 日均时长：1 小时 15 分钟
   └─ 环比增长：↑ 12%

📖 当前在读
   1️⃣ 三体 [84%] - 最后阅读：2小时前
   2️⃣ 活着 [92%] - 最后阅读：3天前（即将读完！）

🏆 本月读得最多
   1️⃣ 《三体》- 12 小时 30 分钟
   2️⃣ 《活着》- 4 小时 15 分钟

📂 偏好分类
   科幻 > 文学 > 历史 > 经济 > 哲学
```

**关键代码片段**（伪代码）：
```typescript
async function buildDashboard(apiKey: string) {
  // 获取书架
  const shelf = await POST('/shelf/sync', { skill_version });
  const totalBooks = shelf.books.length + shelf.albums.length + (shelf.mp ? 1 : 0);
  
  // 获取月度统计
  const readData = await POST('/readdata/detail', { 
    mode: 'monthly',
    skill_version 
  });
  const readTimeFormatted = formatSeconds(readData.totalReadTime);
  
  // 批量获取进度（TOP 5 最近阅读）
  const topReadingBooks = shelf.books
    .sort((a, b) => b.readUpdateTime - a.readUpdateTime)
    .slice(0, 5);
  
  const progresses = await Promise.all(
    topReadingBooks.map(b => POST('/book/getprogress', { 
      bookId: b.bookId, 
      skill_version 
    }))
  );
  
  // 组织输出
  return {
    totalBooks,
    readTimeThis Month,
    readDays: readData.readDays,
    topReadingBooks: progresses.map(p => ({
      progress: p.book.progress,
      time: formatSeconds(p.book.recordReadingTime)
    })),
    preferCategories: readData.preferCategory.slice(0, 5)
  };
}
```

---

### 3.2 **智能划线知识库（个人 + 社区）**

**场景**：构建跨多本书的划线/想法知识库，支持全文搜索、关联推荐

**实现流程**：

```
▌ 第一步：同步个人所有笔记
POST /user/notebooks
  ├─ 分页拉取所有有笔记的书
  ├─ 每本书笔记数 = reviewCount + noteCount + bookmarkCount
  └─ 记录 books[].bookId 用于后续查询

▌ 第二步：导出每本书的划线内容
POST /book/bookmarklist (for each bookId)
  ├─ 获取 updated[].markText (划线原文)
  ├─ 获取 updated[].chapterUid (所在章节)
  ├─ 获取 updated[].createTime (创建时间)
  └─ 关联 chapters[] 信息

▌ 第三步：导出每本书的个人想法
POST /review/list/mine (for each bookId)
  ├─ 获取 reviews[].content (个人想法)
  ├─ 获取 reviews[].star (评分)
  ├─ 关联划线通过 chapterName
  └─ 分类：划线想法 / 章节点评 / 整本书评

▌ 第四步：获取社区热门划线（可选）
POST /book/bestbookmarks (for each bookId)
  ├─ 获取全书 TOP20 热门划线
  ├─ 获取 items[].totalCount (多少人划线)
  └─ 后续可查询该划线下的评论

▌ 第五步：建立本地索引
{
  "bookId": "3300045871",
  "bookTitle": "三体",
  "bookAuthor": "刘慈欣",
  "bookmarks": [
    {
      "id": "bm_xxx",
      "text": "我们是...故事的末尾",
      "chapter": "序言",
      "createTime": "2025-01-15",
      "myThought": "非常震撼的开场",
      "communityHighlightCount": 3421,
      "communityThoughts": [...]
    },
    ...
  ]
}
```

**输出示例**：
```
📚 您的划线库 (共 2,345 条划线)

🔍 搜索：想法 + 截图引擎
━━━━━━━━━━━━━━━━━━━━━━━

【三体】第 1 章：宇宙的尽头是中国
━━━━━━━━━━━━━━━━━━━
"人类无法理解的东西，不是道德的，而是逻辑的"
  📍 第 5 页
  💭 我的想法：深刻揭示了文明差异的根源
  🔥 社区热度：2,341 人划线
  
【活着】第 2 章：遭遇
━━━━━━━━━━━━━━━━
"我就这样和我的女人在一起，一辈子就这么过了"
  📍 第 18 页
  💭 我的想法：余华对人生的诠释
  ❤️ 社区热度：5,123 人划线
  💬 评论 143 条
  
[支持按分类、时间、热度、关键词筛选]
```

**技术挑战 & 解决方案**：

| 挑战 | 解决方案 |
|------|--------|
| 分页游标易出错 | 严格遵循文档：`lastSort` 平铺传参，无需 offset |
| 笔记数计算错误 | 必须用 `reviewCount + noteCount + bookmarkCount` |
| 无法导出书签 | 接受限制：书签只有数量，不能导出内容 |
| 社区热度不实时 | 缓存 TTL 设为 1 小时，定期增量同步 |
| 跨书关键词搜索 | 构建本地全文索引（Elasticsearch/MeiliSearch） |

---

### 3.3 **阅读统计高维分析**

**场景**：深度分析阅读行为，支持跨年区间、日历热力图、作者/分类分析

**实现流程**：

```
┌─ 用户问："2024 年 3 月 15 日到今年 2 月 20 日，我读了多久？"

├─ 时间范围识别
│  ├─ 跨年 → 需要多个 annually 结果
│  ├─ 包含当前年份不完整月份 → 需要日级边界修正
│  └─ 不是完整周期 → 使用 dailyReadTimes 扣减

├─ 调用策略
│  ├─ 查询 2024 年：mode=annually, baseTime=2024-03-15
│  ├─ 查询 2025 年：mode=annually, baseTime=2025-01-01
│  ├─ 查询 2024-03 月：mode=monthly, baseTime=2024-03-15
│  ├─ 查询 2025-02 月：mode=monthly, baseTime=2025-02-20
│  └─ 计算：(2024年全年 - 2024-03月全月) + 2024-03-15 至 2024-03-31 日级 + 2025年全年 + (2025-02月全月 - 2025-02-20 之后日级)

├─ 边界修正
│  ├─ 2024-03：返回 dailyReadTimes 后，只扣除 2024-03-01 至 2024-03-14
│  ├─ 2025-02：只扣除 2025-02-21 及之后的日期
│  └─ 2024 年和 2025 年都用完整的 annually 结果

└─ 输出
   时间区间：2024-03-15 ~ 2025-02-20 (约 11 个月)
   总阅读时长：180 小时 45 分钟
   
   月度分布：
   2024-03：8h 30m
   2024-04：15h 20m
   ...
   2025-02：12h 15m
   
   分类分布：科幻(40%) > 文学(30%) > 历史(20%) > 其他(10%)
   作者分布：刘慈欣(12h) > 余华(8h) > 余秋雨(5h)
```

**关键字段速查**：

```typescript
// 阅读时长字段
{
  "totalReadTime": 64800,        // ← 当前周期总时长（秒！）
  "dayAverageReadTime": 4800,    // ← 自然日均（秒）
  "recordReadingTime": 3600,     // ← 朗读/记录类时长（秒）
  "readTimes": {                 // ← 分桶明细（用于图表，不要用来算总数）
    "1704067200": 7200,          // 2024-01-01: 2小时
    "1704153600": 5400           // 2024-01-02: 1.5小时
  },
  "dailyReadTimes": {            // ← 日级明细（用于边界修正）
    "1704067200": 7200,          
    "1704153600": 5400
  },
  "readDays": 15,                // ← 有效阅读天数（不是自然日）
  "readLongest": [               // ← 读得最多的书
    {
      "book": { "bookId": "...", "title": "三体" },
      "readTime": 43200,         // 12小时（秒）
      "tags": ["笔记最多", "单日阅读最久"]
    }
  ]
}
```

**常见错误**：

| 错误 | 后果 | 正确做法 |
|------|------|--------|
| 把 `totalReadTime` 当成分钟 | 数据扩大 60 倍 | 除以 3600 转为小时 |
| 把 `readTimes` 求和当总数 | 截断或不完整 | 用 `totalReadTime` 作主结果 |
| 跨年不调 annually | 漏数据 | 每个自然年单独调一次 |
| 日均用 `readDays` 做分母 | 计算错误 | 用 `dayAverageReadTime` 或自行计算 |
| 边界日期使用月级近似 | 精度不足 | 从 `dailyReadTimes` 精确扣减 |

---

### 3.4 **社交推荐发现引擎**

**场景**：基于阅读数据生成"为你推荐"、"你可能喜欢"等个性化推荐

**实现流程**：

```
▌ 链路 1：个性化推荐（基于阅读历史）
POST /book/recommend?count=20
  ├─ 获取 books[]
  ├─ 每本书包含 reason (如 "你喜欢的作者新作")
  ├─ newRating + newRatingCount (社区评分)
  └─ readingCount (当前在读人数)
  
  输出示例：
  "《活着2》- 你喜欢的作者新作 ⭐4.5 (2.3万评分)"

▌ 链路 2：相似书推荐（基于指定书籍）
POST /book/similar?bookId=3300045871&count=20
  ├─ 获取 booksimilar.books[]
  ├─ 每本书都是与指定书相似的
  └─ 支持翻页 (sessionId + maxIdx)
  
  输出示例：
  "看过《三体》的用户也喜欢..."

▌ 链路 3：热门划线发现（基于章节）
POST /book/bestbookmarks?bookId=3300045871&chapterUid=0
  ├─ 获取全书 TOP20 热门划线 (按热度排序)
  ├─ items[].markText (划线原文)
  ├─ items[].totalCount (多少人划线)
  └─ 后续可查询该划线的评论

▌ 链路 4：评论热度排序（书籍点评）
POST /review/list?bookId=3300045871&reviewListType=1
  ├─ reviewListType 参数:
  │  0=全部, 1=推荐, 2=不行, 3=最新, 4=一般
  ├─ 展示推荐度最高的评论
  ├─ 显示好友点评 (friendCommentUsers[])
  └─ 显示资深会员推荐比例

组合示例：
用户 A 读了《三体》 →
  1. 推荐相似书籍 (similar)
  2. 展示该书热门划线 (bestbookmarks)
  3. 展示友人点评 (好友也读过?)
  4. 推荐作者新作 (recommend 中有 reason)
```

**输出示例**：
```
📖 看过《三体》的人都在读

1️⃣ 《活着》 - 你朋友李明也在读
   ⭐ 4.8 分 (5.2万评价) · 35万人在读
   
2️⃣ 《人类简史》 - 相似的科幻思想
   ⭐ 4.6 分 (3.1万评价) · 18万人在读
   
3️⃣ 《未来简史》 - 续作必读
   ⭐ 4.5 分 (2.8万评价) · 12万人在读

━━━━━━━━━━━━━━━━━━━━

📝 《三体》最受欢迎的划线

"我们是虫子,即使爬到了最高的地方，头顶依然是一望无际的天空。"
👥 3,421 人划线 · 💬 285 条想法

"宇宙很大，生活更大，我们永远在宇宙中漂流。"
👥 2,856 人划线 · 💬 156 条想法

💡 你的朋友王五 等 12 人 对这条划线有想法
```

---

### 3.5 **章节热度与学习指南**

**场景**：某教科书/学习书籍，用热门划线帮助学生理解重点

**实现流程**：

```
POST /book/chapterinfo?bookId=xxx
  获取 chapters[].chapterUid

for each chapter:
  POST /book/underlines?bookId=xxx&chapterUid=yyy
    获取该章每条划线的热度 (underlines[].count 人数)
  
  POST /book/bestbookmarks?bookId=xxx&chapterUid=yyy&count=10
    获取该章 TOP10 热门划线 (markText + totalCount)

输出组织：
按热度排序，形成"学习指南"
```

**输出示例**：
```
📚 《高中物理必修 1》 - 学习重点地图

第一章：运动的描述
━━━━━━━━━━━━━━━━━━━━━
🔥 重点划线（学生关注度）

TOP 1：匀加速直线运动的加速度公式 a = Δv/Δt
      👥 2,341 人划线  
      💬 学生想法：为什么要用变化率？

TOP 2：位移与路程的区别
      👥 1,856 人划线
      💬 学生最容易混淆的地方

TOP 3：速度是矢量概念
      👥 1,023 人划线

[支持按热度筛选，帮助学生抓住考点]
```

---

## 四、关键技术实现

### 4.1 时间戳处理

**核心规则**：所有 Unix 时间戳展示前必须转为 `YYYY-MM-DD` 格式

```typescript
// ✅ 正确
const formatTimestamp = (ts: number): string => {
  return new Date(ts * 1000).toISOString().split('T')[0];
  // 1748563200 → "2025-05-30"
};

// ❌ 错误：直接展示原始数字
console.log(readUpdateTime);  // 输出 1748563200（用户看不懂）

// ❌ 错误：毫秒误认为秒
new Date(1748563200).toISOString();  // 参数应 * 1000
```

### 4.2 时长单位转换

**核心规则**：所有时长字段单位为秒，展示需转为"X小时Y分钟"

```typescript
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) return `${minutes}分钟`;
  if (minutes === 0) return `${hours}小时`;
  return `${hours}小时${minutes}分钟`;
  
  // 64800 → "18小时"
  // 3900 → "1小时5分钟"
};

// ⚠️ 常见错误
const wrong1 = readData.totalReadTime; // 64800 - 不
```

是秒，不是毫秒！
const wrong2 = new Date(readData.totalReadTime); // ❌ 会导致时间戳错误
```

### 4.3 分页游标使用模式

**关键概念**：微信读书不使用 offset/limit，而是基于**游标（cursor）**或**排序值（lastSort）**的无状态分页。

```typescript
// ✅ 第一页请求
const req1 = {
  api_name: "/user/notebooks",
  count: 20,
  skill_version: "1.0.3"
  // 无 lastSort，默认从头开始
};

// 获得响应后
const res1 = await fetch(gateway, req1);
// res1 = {
//   books: [...20条],
//   lastSort: 1516907353,  // ⭐️ 游标值
//   hasMore: true
// }

// ✅ 第二页请求 - 直接使用 lastSort
const req2 = {
  api_name: "/user/notebooks",
  count: 20,
  lastSort: 1516907353,  // ⭐️ 使用上一页的游标
  skill_version: "1.0.3"
};

const res2 = await fetch(gateway, req2);

// ❌ 错误方式 - 使用 offset/limit
const wrongReq = {
  api_name: "/user/notebooks",
  offset: 20,
  limit: 20  // 无效参数，会被忽略
};
```

**游标工作流程图**：
```
请求1(无lastSort)
    ↓
获得 items[0-19] + lastSort=100
    ↓
请求2(lastSort=100)
    ↓
获得 items[20-39] + lastSort=200
    ↓
请求3(lastSort=200)
    ↓
获得 items[40-59] + hasMore=false
    ↓
分页结束
```

### 4.4 版本升级强制流程

**这是最容易被忽视的坑**：

```typescript
async function callWeReadAPI(apiName: string, params: any) {
  // 先获取当前版本
  const currentVersion = "1.0.3";
  
  // 发起请求
  const response = await fetch(gateway, {
    ...params,
    api_name: apiName,
    skill_version: currentVersion
  });
  
  const data = await response.json();
  
  // ⚠️ 关键：检查升级通知
  if (data.upgrade_info) {
    // ❌ 常见错误：忽视 upgrade_info
    console.warn("检测到新版本:", data.upgrade_info.message);
    
    // ✅ 正确做法：中断当前操作
    throw new Error(`需要升级: ${data.upgrade_info.message}`);
    // 提示用户升级后重试
  }
  
  // 只有在 errcode === 0 时才继续
  if (data.errcode !== 0) {
    throw new Error(`API错误: ${data.errcode} - ${data.errmsg}`);
  }
  
  return data;
}

// 使用示例
try {
  const result = await callWeReadAPI("/book/info", { bookId: 3300010569 });
} catch (err) {
  if (err.message.includes("需要升级")) {
    // 弹出升级对话框，引导用户升级 Skill
  }
}
```

### 4.5 中文错误码速查表

| errcode | 含义 | 处理方法 |
|---------|------|---------|
| 0 | 成功 | 继续处理 |
| -1 | 未授权/API Key 过期 | 提示重新配置 WEREAD_API_KEY |
| -2 | 参数错误 | 检查 api_name、参数拼写 |
| -3 | 资源不存在 | bookId/chapterUid 无效 |
| -4 | 用户无权限 | 此用户未购买/收藏该书 |
| -5 | 服务暂时不可用 | 重试或稍后再试 |
| -6 | 速率限制 | 降低请求频率 |

```typescript
const errorMessages: Record<number, string> = {
  0: "✅ 成功",
  "-1": "❌ 认证失败 - 请检查 WEREAD_API_KEY",
  "-2": "❌ 参数错误 - 检查请求格式",
  "-3": "❌ 书籍不存在",
  "-4": "❌ 无权限访问",
  "-5": "⚠️ 服务暂时不可用，请稍候",
  "-6": "⚠️ 请求过于频繁，请降低请求速率"
};
```

---

## 五、高价值应用场景详解

### 场景 1：构建个人读书数据仓库

**目标**：将用户所有阅读数据离线化，支持本地分析和导出。

**技术方案**：

```typescript
/**
 * 场景1：个人读书数据仓库导出
 * 用途：定期同步用户数据到本地数据库，支持备份/分析
 */
class WeReadDataWarehouse {
  private apiKey: string;
  private userId: string;
  private db: SQLiteDatabase; // 本地数据库
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.db = new SQLiteDatabase('weread_warehouse.db');
  }
  
  // 步骤1：全量同步书架
  async syncAllBooks() {
    console.log('📚 开始同步书架...');
    
    const shelf = await this.callAPI('/shelf/sync', {});
    const allBooks = [
      ...shelf.books,
      ...shelf.albums,
      ...(shelf.mp ? [shelf.mp] : [])
    ];
    
    for (const book of allBooks) {
      // 插入或更新书籍基本信息
      await this.db.run(
        `INSERT OR REPLACE INTO books 
         (bookId, title, author, cover, rating, intro, type, addTime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          book.bookId || book.albumId,
          book.title,
          book.author || book.authorName,
          book.cover,
          book.rating,
          book.intro,
          book.bookId ? 'book' : 'album',
          new Date().toISOString()
        ]
      );
    }
    
    console.log(`✅ 已同步 ${allBooks.length} 本书`);
    return allBooks;
  }
  
  // 步骤2：获取每本书的详细信息
  async syncBookDetails(bookId: string) {
    const [info, chapters, progress, bookmarks] = await Promise.all([
      this.callAPI('/book/info', { bookId }),
      this.callAPI('/book/chapterinfo', { bookId }),
      this.callAPI('/book/getprogress', { bookId }),
      this.callAPI('/book/bookmarklist', { bookId, count: 1000 })
    ]);
    
    // 保存章节结构
    for (const chapter of chapters.chapters || []) {
      await this.db.run(
        `INSERT OR REPLACE INTO chapters 
         (bookId, chapterUid, title, level, wordCount)
         VALUES (?, ?, ?, ?, ?)`,
        [bookId, chapter.chapterUid, chapter.title, chapter.level, chapter.wordCount]
      );
    }
    
    // 保存阅读进度
    await this.db.run(
      `INSERT OR REPLACE INTO progress 
       (bookId, progress, chapterUid, readTime)
       VALUES (?, ?, ?, ?)`,
      [bookId, progress.progress, progress.chapterUid, progress.recordReadingTime]
    );
    
    // 保存所有划线
    for (const bookmark of bookmarks.items || []) {
      await this.db.run(
        `INSERT OR REPLACE INTO bookmarks 
         (bookmarkId, bookId, chapterUid, markText, range, type, createTime)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bookmark.bookmarkId,
          bookId,
          bookmark.chapterUid,
          bookmark.markText,
          JSON.stringify(bookmark.range),
          bookmark.type, // 1=划线, 2=想法
          new Date(bookmark.createTime * 1000).toISOString()
        ]
      );
    }
    
    console.log(`✅ 已保存书籍 ${info.title} 的详细信息`);
  }
  
  // 步骤3：导出数据为多种格式
  async exportToFormats() {
    // 导出为 CSV
    const csvData = await this.db.all(
      `SELECT b.title, b.author, COUNT(bm.bookmarkId) as noteCount, 
              p.progress FROM books b 
       LEFT JOIN bookmarks bm ON b.bookId = bm.bookId
       LEFT JOIN progress p ON b.bookId = p.bookId
       GROUP BY b.bookId`
    );
    
    const csv = this.convertToCSV(csvData);
    await fs.writeFile('reading_list.csv', csv);
    
    // 导出为 JSON
    const allData = {
      exportDate: new Date().toISOString(),
      books: csvData,
      totalReadTime: await this.getTotalReadTime(),
      readDays: await this.getReadDays(),
      statistics: await this.getStatistics()
    };
    
    await fs.writeFile('reading_data.json', JSON.stringify(allData, null, 2));
    
    // 导出为 Markdown（可导入 Notion/Obsidian）
    const mdContent = this.convertToMarkdown(csvData);
    await fs.writeFile('reading_list.md', mdContent);
    
    console.log('📤 数据已导出: reading_list.csv, reading_data.json, reading_list.md');
  }
  
  // 辅助：获取总阅读时长
  private async getTotalReadTime() {
    const result = await this.callAPI('/readdata/gettotalreadtime', {});
    return this.formatDuration(result.totalReadTime);
  }
  
  // 辅助：获取阅读天数
  private async getReadDays() {
    const result = await this.callAPI('/readdata/getreaddays', {});
    return result.readDays;
  }
  
  private formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
  
  private async callAPI(apiName: string, params: any) {
    const response = await fetch('https://i.weread.qq.com/api/agent/gateway', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_name: apiName,
        ...params,
        skill_version: "1.0.3"
      })
    });
    
    return response.json();
  }
}

// 使用示例
const warehouse = new WeReadDataWarehouse(process.env.WEREAD_API_KEY);

// 定期同步（例如每周执行一次）
async function syncRoutine() {
  const books = await warehouse.syncAllBooks();
  
  for (const book of books) {
    await warehouse.syncBookDetails(book.bookId || book.albumId);
  }
  
  await warehouse.exportToFormats();
  console.log('✅ 本周数据同步完成');
}

// 定时任务
schedule.scheduleJob('0 0 * * 0', syncRoutine); // 每周日午夜执行
```

**输出效果**：
```csv
书名,作者,笔记数,进度
三体,刘慈欣,47,100%
活着,余华,12,85%
人生,路遥,28,100%
```

---

### 场景 2：AI 阅读助手（笔记分析与总结）

**目标**：利用用户的划线和想法，结合 AI 生成阅读总结、关键概念提取、跨书联想。

```typescript
/**
 * 场景2：AI 阅读助手
 * 用途：基于用户笔记，用 AI 进行深度分析
 */
class AIReadingAssistant {
  private wereadAPI: WeReadAPI;
  private openaiClient: OpenAI;
  
  constructor(wereadKey: string, openaiKey: string) {
    this.wereadAPI = new WeReadAPI(wereadKey);
    this.openaiClient = new OpenAI({ apiKey: openaiKey });
  }
  
  // 核心功能1：书籍智能总结
  async generateBookSummary(bookId: string) {
    // 获取书籍信息和所有用户划线
    const [bookInfo, userBookmarks, hotBookmarks] = await Promise.all([
      this.wereadAPI.getBookInfo(bookId),
      this.wereadAPI.getAllBookmarks(bookId, { type: 'user' }),
      this.wereadAPI.getBestBookmarks(bookId)
    ]);
    
    // 组织上下文
    const context = `
书籍信息：
- 标题: ${bookInfo.title}
- 作者: ${bookInfo.author}
- 简介: ${bookInfo.intro}

用户的关键划线（${userBookmarks.length}条）：
${userBookmarks.map(bm => `- "${bm.markText}"`).join('\n')}

全书热门划线（${hotBookmarks.length}条）：
${hotBookmarks.map(bm => `- "${bm.markText}" (${bm.like}人赞)`).join('\n')}
    `;
    
    // 调用 GPT 生成总结
    const completion = await this.openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "你是一个专业的读书总结助手。基于用户的划线和热门划线，生成深入的书籍总结、核心观点和个人启发。"
        },
        {
          role: "user",
          content: `请基于以下划线内容，为我生成《${bookInfo.title}》的：
1. 3句话核心总结
2. 5个关键概念
3. 3条个人启发
4. 与其他书籍的联想（如果有）

${context}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    return {
      bookId,
      title: bookInfo.title,
      author: bookInfo.author,
      summary: completion.choices[0].message.content,
      userNoteCount: userBookmarks.length,
      generatedAt: new Date().toISOString()
    };
  }
  
  // 核心功能2：跨书概念连接
  async linkConceptsAcrossBooks(userBookIds: string[]) {
    // 获取所有书籍的用户划线
    const allBookmarksData = await Promise.all(
      userBookIds.map(async (bookId) => {
        const bookmarks = await this.wereadAPI.getAllBookmarks(bookId);
        const info = await this.wereadAPI.getBookInfo(bookId);
        return { title: info.title, bookmarks };
      })
    );
    
    // 提取所有标记文本
    const allTexts = allBookmarksData
      .flatMap(data => data.bookmarks.map(bm => ({
        text: bm.markText,
        book: data.title,
        chapter: bm.chapter
      })));
    
    // 用 AI 找出跨书的相似概念
    const completion = await this.openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "分析用户在多本书中的划线，找出跨书的相似主题、概念和思想联系。"
        },
        {
          role: "user",
          content: `分析以下来自 ${userBookIds.length} 本书的划线内容，找出3-5个跨书出现的核心概念或主题：

${allTexts.map(t => `[${t.book}] "${t.text}"`).join('\n')}

请输出：
1. 发现的核心主题（每个包含出现的书籍数和具体例子）
2. 这些主题之间的关系图
3. 对用户阅读品味的分析`
        }
      ]
    });
    
    return {
      books: userBookIds.length,
      analysis: completion.choices[0].message.content,
      totalBookmarks: allTexts.length,
      generatedAt: new Date().toISOString()
    };
  }
  
  // 核心功能3：划线深度解析
  async analyzeBookmark(bookId: string, bookmarkId: string) {
    const bookmark = await this.wereadAPI.getBookmarkDetail(bookId, bookmarkId);
    const bookInfo = await this.wereadAPI.getBookInfo(bookId);
    
    // 获取该划线的相关评论/想法
    const thoughts = await this.wereadAPI.getBookmarkThoughts(bookId, bookmarkId);
    
    // 构建分析提示
    const analysisPrompt = `
请深度分析这句话在《${bookInfo.title}》中的意义：

原文："${bookmark.markText}"
出现位置：${bookmark.chapter}

相关的读者想法（${thoughts.length}条）：
${thoughts.map(t => `- "${t.content}" by ${t.author}`).join('\n')}

请提供：
1. 这句话的深层含义解读
2. 在书籍整体框架中的位置和作用
3. 生活/工作中的应用场景（3个例子）
4. 与哲学/心理学的联系
    `;
    
    const completion = await this.openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "你是一个深度阅读分析专家，能从一句话挖掘其深层意义和实际应用。"
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1200
    });
    
    return {
      bookmarkId,
      text: bookmark.markText,
      analysis: completion.choices[0].message.content,
      relatedThoughts: thoughts.length,
      generatedAt: new Date().toISOString()
    };
  }
}

// 使用示例
const assistant = new AIReadingAssistant(
  process.env.WEREAD_API_KEY,
  process.env.OPENAI_API_KEY
);

// 生成最近读完书籍的 AI 总结
const recentBooks = ['3300010569', '3300012895']; // 三体、活着
for (const bookId of recentBooks) {
  const summary = await assistant.generateBookSummary(bookId);
  console.log(`📖 ${summary.title}:\n${summary.summary}\n`);
}

// 分析阅读品味中的跨书主题
const themes = await assistant.linkConceptsAcrossBooks(recentBooks);
console.log(`🔗 你的阅读主题:\n${themes.analysis}`);
```

---

### 场景 3：阅读社交互动系统

**目标**：构建基于微信读书的社交功能（热门划线讨论、书评推荐、读书小组）。

```typescript
/**
 * 场景3：阅读社交互动
 * 用途：基于热门划线和书评构建社区互动
 */
class ReadingSocialHub {
  private wereadAPI: WeReadAPI;
  private db: Database;
  
  // 功能1：热门划线讨论广场
  async getHotBookmarkForum(bookId: string) {
    const hotBookmarks = await this.wereadAPI.getBestBookmarks(bookId);
    
    const forum = {
      book: await this.wereadAPI.getBookInfo(bookId),
      discussions: []
    };
    
    for (const bookmark of hotBookmarks.slice(0, 10)) {
      // 获取该划线下的热门想法/评论
      const thoughts = await this.wereadAPI.getBookmarkThoughts(bookId, bookmark.bookmarkId);
      
      forum.discussions.push({
        highlightId: bookmark.bookmarkId,
        text: bookmark.markText,
        likeCount: bookmark.like,
        chapter: bookmark.chapter,
        topThoughts: thoughts.slice(0, 3).map(t => ({
          author: t.author,
          content: t.content,
          likes: t.likeCount
        }))
      });
    }
    
    return forum;
  }
  
  // 功能2：个性化书评推荐
  async getRecommendedReviews(bookId: string) {
    const reviews = await this.wereadAPI.getBookReviews(bookId, { count: 50 });
    
    // 按热度和用户相似度排序
    const recommendedReviews = reviews
      .filter(r => r.star >= 3) // 过滤低分评论
      .sort((a, b) => (b.like || 0) - (a.like || 0))
      .slice(0, 10)
      .map(r => ({
        reviewId: r.reviewId,
        author: r.authorName,
        rating: r.star,
        content: r.content.substring(0, 200),
        likeCount: r.like,
        finishStatus: r.finishStatus // 是否读完
      }));
    
    return recommendedReviews;
  }
  
  // 功能3：读书小组数据聚合
  async createReadingClub(bookId: string, memberIds: string[]) {
    const club = {
      bookId,
      book: await this.wereadAPI.getBookInfo(bookId),
      members: [],
      statistics: {},
      discussions: []
    };
    
    // 聚合小组成员的阅读进度和笔记
    for (const memberId of memberIds) {
      const progress = await this.wereadAPI.getProgress(bookId);
      const bookmarks = await this.wereadAPI.getAllBookmarks(bookId);
      
      club.members.push({
        memberId,
        progress: progress.progress,
        noteCount: bookmarks.length,
        lastReadTime: progress.lastReadTime
      });
    }
    
    // 计算小组统计
    club.statistics = {
      avgProgress: club.members.reduce((sum, m) => sum + m.progress, 0) / memberIds.length,
      totalNotes: club.members.reduce((sum, m) => sum + m.noteCount, 0),
      activeMembers: club.members.filter(m => m.progress > 0).length
    };
    
    // 创建讨论板块
    club.discussions = await this.createDiscussionThreads(bookId);
    
    return club;
  }
  
  private async createDiscussionThreads(bookId: string) {
    const hotBookmarks = await this.wereadAPI.getBestBookmarks(bookId);
    
    return hotBookmarks.slice(0, 5).map(bookmark => ({
      threadId: `thread_${bookmark.bookmarkId}`,
      title: `讨论：${bookmark.markText.substring(0, 40)}...`,
      quote: bookmark.markText,
      chapter: bookmark.chapter,
      posts: []
    }));
  }
}

// 使用示例
const hub = new ReadingSocialHub();

// 查看《三体》的热门划线讨论
const forum = await hub.getHotBookmarkForum('3300010569');
console.log(`📚 ${forum.book.title} 的热门讨论：`);
forum.discussions.forEach(d => {
  console.log(`\n💡 "${d.text}" (${d.likeCount}人赞)`);
  d.topThoughts.forEach(t => {
    console.log(`  → ${t.author}: ${t.content}`);
  });
});

// 建立读书小组
const club = await hub.createReadingClub('3300010569', 
  ['user1', 'user2', 'user3']);
console.log(`📖 小组进度：${club.statistics.avgProgress}%`);
console.log(`📝 总共标记了 ${club.statistics.totalNotes} 条笔记`);
```

---

### 场景 4：阅读数据可视化仪表板

**目标**：实时展示用户的阅读统计、阅读品味、进度跟踪。

```typescript
/**
 * 场景4：阅读数据可视化
 * 输出：Web Dashboard 或 Notion 集成
 */
class ReadingDashboard {
  private wereadAPI: WeReadAPI;
  
  // 生成 Markdown 形式的月度阅读报告
  async generateMonthlyReport(month: Date) {
    const readData = await this.wereadAPI.getReadData();
    const booksDone = await this.wereadAPI.getFinishedBooks(month);
    const inProgress = await this.wereadAPI.getInProgressBooks();
    
    const report = `
# 📚 阅读月报 - ${month.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}

## 📊 数据概览

| 指标 | 数值 |
|------|------|
| 本月阅读时长 | ${this.formatDuration(readData.monthlyReadTime)} |
| 本月阅读天数 | ${readData.monthlyReadDays} 天 |
| 完成书籍数 | ${booksDone.length} 本 |
| 在读书籍数 | ${inProgress.length} 本 |
| 平均每天阅读 | ${this.formatDuration(readData.monthlyReadTime / readData.monthlyReadDays)} |

## ✅ 本月完成书籍

${booksDone.map((book, i) => `
${i + 1}. **${book.title}** - ${book.author}
   - ⭐ ${book.rating}/10
   - 📝 ${book.noteCount} 条笔记
   - ⏱️ 阅读 ${this.formatDuration(book.readTime)}
`).join('\n')}

## 🔄 在读书籍

${inProgress.map((book, i) => `
${i + 1}. **${book.title}** - ${book.author}
   - 📖 进度 ${book.progress}%
   - 📝 ${book.noteCount} 条笔记
   - ⏱️ 已阅读 ${this.formatDuration(book.readTime)}
`).join('\n')}

## 📈 阅读趋势

\`\`\`
周一 ████████░░ 2h15m
周二 ███████░░░ 1h45m
周三 ██████░░░░ 1h30m
周四 █████░░░░░ 1h00m
周五 ███████████ 2h45m
周六 ████████████ 3h00m
周日 ██████░░░░ 1h30m
\`\`\`

---
*报告生成于 ${new Date().toLocaleString('zh-CN')}*
    `;
    
    return report;
  }
  
  // 生成 JSON 格式的数据用于 API 返回
  async generateDashboardJSON() {
    const [bookShelf, readData, recentActivity] = await Promise.all([
      this.wereadAPI.getShelf(),
      this.wereadAPI.getReadData(),
      this.wereadAPI.getRecentActivity()
    ]);
    
    return {
      user: {
        totalBooksRead: bookShelf.totalCount,
        totalReadTime: readData.totalReadTime,
        currentStreak: readData.continuousDays,
        rank: readData.rank
      },
      books: {
        total: bookShelf.totalCount,
        finished: bookShelf.books.filter(b => b.progress === 100).length,
        inProgress: bookShelf.books.filter(b => b.progress > 0 && b.progress < 100).length,
        notStarted: bookShelf.books.filter(b => b.progress === 0).length
      },
      recentBooks: bookShelf.books.slice(0, 10).map(b => ({
        id: b.bookId,
        title: b.title,
        author: b.author,
        cover: b.cover,
        progress: b.progress,
        rating: b.rating
      })),
      weeklyStats: {
        booksRead: recentActivity.weeklyBooks,
        hoursRead: Math.floor(recentActivity.weeklyTime / 3600),
        highlightsCreated: recentActivity.weeklyHighlights
      }
    };
  }
  
  private formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h${minutes}m`;
  }
}

// 导出为 Notion Database
async function exportToNotion(dashboard: ReadingDashboard) {
  const monthlyReport = await dashboard.generateMonthlyReport(new Date());
  
  // 调用 Notion API
  const notionPage = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      '标题': { title: [{ text: { content: '📚 阅读月报' } }] },
      '日期': { date: { start: new Date().toISOString() } }
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { text: [{ text: { content: monthlyReport } }] }
      }
    ]
  });
  
  console.log(`✅ 已导出到 Notion: ${notionPage.url}`);
}
```

---

## 六、常见坑点与避坑指南

### 6.1 参数序列化陷阱

❌ **错误案例**：
```typescript
// 错误1：参数嵌套在 params 里
const wrong1 = {
  api_name: "/book/info",
  params: { bookId: "3300010569" }
};
// 结果：bookId 被忽视，返回空

// 错误2：忘记转换时间戳
const wrong2 = {
  api_name: "/readdata/gettotalreadtime",
  startTime: new Date() // ❌ 应该是秒级整数
};

// 错误3：缺少 skill_version
const wrong3 = {
  api_name: "/shelf/sync"
  // ❌ 缺少 skill_version，可能被拒绝
};
```

✅ **正确做法**：
```typescript
// 正确1：参数平铺
const right1 = {
  api_name: "/book/info",
  bookId: "3300010569",
  skill_version: "1.0.3"
};

// 正确2：时间戳转秒
const right2 = {
  api_name: "/readdata/gettotalreadtime",
  startTime: Math.floor(Date.now() / 1000),
  skill_version: "1.0.3"
};

// 正确3：务必包含版本
const right3 = {
  api_name: "/shelf/sync",
  skill_version: "1.0.3"
};
```

### 6.2 分页游标陷阱

❌ **错误案例**：
```typescript
// 错误：使用 offset/limit（微信读书不支持）
const allBooks = [];
for (let offset = 0; offset < 1000; offset += 20) {
  const res = await callAPI('/shelf/sync', {
    offset, limit: 20  // ❌ 这些参数会被忽视
  });
  allBooks.push(...res.books);
}
// 结果：死循环或只返回第一页

// 错误：没有保存 lastSort
let hasMore = true;
while (hasMore) {
  const res = await callAPI('/user/notebooks', { count: 20 });
  // ❌ 忘记使用 res.lastSort，下一页仍从头开始
  hasMore = res.hasMore;
}
```

✅ **正确做法**：
```typescript
// 正确：使用游标式分页
const allBooks = [];
let lastSort = null;
let hasMore = true;

while (hasMore) {
  const params = { count: 20, skill_version: "1.0.3" };
  if (lastSort) params.lastSort = lastSort; // ✅ 使用游标
  
  const res = await callAPI('/user/notebooks', params);
  allBooks.push(...res.items);
  
  lastSort = res.lastSort; // ✅ 保存游标用于下一页
  hasMore = res.hasMore;
}
```

### 6.3 阅读统计字段陷阱

❌ **错误案例**：
```typescript
// 错误1：混淆周和月的统计
const stats = await callAPI('/readdata/getcurrentgeneralize');
const weekBooks = stats.readData.weekBooks; // ❌ 可能是其他单位

// 错误2：假设所有用户都有头像和签名
const profile = await callAPI('/profile/get');
console.log(profile.avatar); // ❌ 可能是 null
console.log(profile.signature); // ❌ 可能是空字符串

// 错误3：假设书籍评分总是非空
const book = await callAPI('/book/info', { bookId });
const stars = book.rating * 5; // ❌ rating 可能是 null
```

✅ **正确做法**：
```typescript
// 正确1：查看接口文档，明确字段含义
const stats = await callAPI('/readdata/getcurrentgeneralize');
const weekBooks = stats.weekBooks; // 查文档确认这是周统计
const monthBooks = stats.monthBooks; // 月统计

// 正确2：添加防御性检查
const profile = await callAPI('/profile/get');
console.log(profile.avatar || '/default-avatar.png');
console.log(profile.signature || '暂无签名');

// 正确3：使用默认值或条件判断
const book = await callAPI('/book/info', { bookId });
const stars = (book.rating || 0) * 5;
const ratingText = book.rating ? `${book.rating}/10` : '暂无评分';
```

### 6.4 速率限制与重试

```typescript
/**
 * 实现指数退避重试机制
 */
async function callAPIWithRetry(apiName: string, params: any, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WEREAD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_name: apiName,
          ...params,
          skill_version: "1.0.3"
        })
      });
      
      const data = await response.json();
      
      // 速率限制错误
      if (data.errcode === -6) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`⏱️  速率限制，${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // 其他错误
      if (data.errcode !== 0) {
        throw new Error(`API错误 ${data.errcode}: ${data.errmsg}`);
      }
      
      return data;
      
    } catch (err) {
      lastError = err;
      console.error(`❌ 第 ${attempt + 1} 次尝试失败: ${err.message}`);
    }
  }
  
  throw lastError || new Error('请求失败');
}
```

---

## 七、集成最佳实践

### 7.1 错误处理规范

```typescript
class WeReadAPIError extends Error {
  constructor(
    public code: number,
    public message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'WeReadAPIError';
  }
}

// 统一的 API 调用包装器
async function safeCallWeReadAPI<T>(
  apiName: string,
  params: Record<string, any>,
  options: { retry?: number; timeout?: number } = {}
): Promise<T> {
  const { retry = 2, timeout = 30000 } = options;
  
  for (let i = 0; i <= retry; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() =>
controller.abort(), timeout);
      
      const response = await fetch(gateway, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WEREAD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...params,
          api_name: apiName,
          skill_version: "1.0.3"
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new WeReadAPIError(response.status, `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // ⭐️ 版本升级检查
      if (data.upgrade_info) {
        throw new WeReadAPIError(
          -100,
          `需要升级: ${data.upgrade_info.message}`
        );
      }
      
      // ⭐️ 错误码检查
      if (data.errcode !== 0) {
        throw new WeReadAPIError(
          data.errcode,
          data.errmsg || errorMessages[data.errcode] || '未知错误'
        );
      }
      
      return data as T;
      
    } catch (error) {
      // 不重试的错误
      if (error instanceof WeReadAPIError) {
        if (error.code === -100) {
          throw error; // 版本升级必须停止
        }
        if (error.code === -1) {
          throw error; // 认证错误必须停止
        }
        if (i === retry) {
          throw error; // 最后一次重试也失败
        }
      }
      
      console.warn(`请求失败(第${i+1}次): ${error.message}，准备重试...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw new WeReadAPIError(-5, '请求失败，已达到最大重试次数');
}

// 使用示例
const bookInfo = await safeCallWeReadAPI(
  '/book/info',
  { bookId: 3300010569 },
  { retry: 3, timeout: 30000 }
);
```

---

## 六、高价值应用场景详解

### 场景 1：构建个人读书数据仓库与分析引擎

**背景**：用户想要离线备份所有阅读数据，进行本地分析和导出。

**核心需求**：
- 同步全部书架数据
- 导出所有笔记和划线
- 生成阅读统计报告
- 支持数据本地持久化

**实现流程**：

```typescript
interface ReadingDataWarehouse {
  userId: string;
  exportTime: Date;
  books: BookRecord[];
  notebooks: NotebookRecord[];
  readingStats: ReadingStatistics;
}

interface BookRecord {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  progress: number;
  readingTime: number;
  chapters: ChapterInfo[];
  purchaseTime: Date;
  status: 'reading' | 'finished' | 'want_to_read';
}

interface NotebookRecord {
  bookmarkId: string;
  bookId: string;
  chapterUid: string;
  markText: string;
  range: string;
  type: 'highlight' | 'thought' | 'bookmark';
  createTime: Date;
  updateTime?: Date;
  likes?: number;
}

// 第一步：同步书架
async function syncShelf(): Promise<BookRecord[]> {
  const books: BookRecord[] = [];
  let lastSort: number | undefined;
  
  while (true) {
    const res = await safeCallWeReadAPI(
      '/shelf/sync',
      { count: 50, lastSort }
    );
    
    // 处理电子书
    if (res.books) {
      for (const book of res.books) {
        const progress = await getBookProgress(book.bookId);
        books.push({
          bookId: book.bookId,
          title: book.title,
          author: book.author,
          cover: book.cover,
          rating: book.rating,
          progress: progress.progress,
          readingTime: progress.readingTime,
          chapters: [],
          purchaseTime: new Date(book.createTime * 1000),
          status: progress.progress === 100 ? 'finished' : 'reading'
        });
      }
    }
    
    // 处理专辑（有声书）
    if (res.albums) {
      for (const album of res.albums) {
        books.push({
          bookId: album.albumId,
          title: album.name,
          author: album.authorName,
          cover: album.cover,
          rating: album.rating || 0,
          progress: album.finish ? 100 : 0,
          readingTime: 0,
          chapters: [],
          purchaseTime: new Date(album.createTime * 1000),
          status: album.finish ? 'finished' : 'reading'
        });
      }
    }
    
    if (!res.hasMore) break;
    lastSort = res.lastSort;
  }
  
  return books;
}

// 第二步：导出所有笔记（支持增量更新）
async function syncAllNotebooks(
  books: BookRecord[],
  lastSyncTime?: Date
): Promise<NotebookRecord[]> {
  const notebooks: NotebookRecord[] = [];
  
  for (const book of books) {
    let lastSort: number | undefined;
    
    while (true) {
      const res = await safeCallWeReadAPI(
        '/book/bookmarklist',
        {
          bookId: book.bookId,
          count: 100,
          lastSort
        }
      );
      
      if (res.items) {
        for (const item of res.items) {
          const createTime = new Date(item.createTime * 1000);
          
          // 支持增量同步：只导出新增笔记
          if (!lastSyncTime || createTime > lastSyncTime) {
            notebooks.push({
              bookmarkId: item.bookmarkId,
              bookId: book.bookId,
              chapterUid: item.chapterUid,
              markText: item.markText,
              range: `${item.range.startOffset}-${item.range.endOffset}`,
              type: item.type === 0 ? 'highlight' : 'thought',
              createTime,
              updateTime: item.updateTime ? new Date(item.updateTime * 1000) : undefined,
              likes: item.likes
            });
          }
        }
      }
      
      if (!res.hasMore) break;
      lastSort = res.lastSort;
    }
  }
  
  return notebooks;
}

// 第三步：生成阅读统计报告
async function generateReadingReport(): Promise<ReadingStatistics> {
  const readData = await safeCallWeReadAPI('/readdata/yearreport');
  
  return {
    totalReadTime: readData.totalReadTime,
    readDays: readData.readDays,
    finishCount: readData.finishCount,
    preferCategory: readData.preferCategory,
    preferAuthor: readData.preferAuthor,
    readingRank: readData.readingRank,
    monthlyData: readData.monthlyData,
    categoryDistribution: readData.categoryDistribution
  };
}

// 第四步：完整导出到 JSON
async function exportReadingDataWarehouse(): Promise<ReadingDataWarehouse> {
  const books = await syncShelf();
  const notebooks = await syncAllNotebooks(books);
  const stats = await generateReadingReport();
  
  return {
    userId: process.env.WEREAD_USER_ID,
    exportTime: new Date(),
    books,
    notebooks,
    readingStats: stats
  };
}

// 使用示例
const warehouse = await exportReadingDataWarehouse();
fs.writeFileSync('reading_warehouse.json', JSON.stringify(warehouse, null, 2));
```

**进阶：支持本地数据库存储**

```typescript
import sqlite3 from 'sqlite3';

class ReadingDataStore {
  private db: sqlite3.Database;
  
  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
    this.initTables();
  }
  
  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        bookId TEXT PRIMARY KEY,
        title TEXT,
        author TEXT,
        rating REAL,
        progress INTEGER,
        readingTime INTEGER,
        syncTime TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS notebooks (
        bookmarkId TEXT PRIMARY KEY,
        bookId TEXT,
        markText TEXT,
        type TEXT,
        createTime TIMESTAMP,
        FOREIGN KEY(bookId) REFERENCES books(bookId)
      );
      
      CREATE TABLE IF NOT EXISTS sync_log (
        syncTime TIMESTAMP,
        bookCount INTEGER,
        notebookCount INTEGER,
        status TEXT
      );
    `);
  }
  
  async upsertBooks(books: BookRecord[]) {
    for (const book of books) {
      await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT OR REPLACE INTO books 
           (bookId, title, author, rating, progress, readingTime, syncTime)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [book.bookId, book.title, book.author, book.rating, 
           book.progress, book.readingTime, new Date()],
          (err) => err ? reject(err) : resolve(null)
        );
      });
    }
  }
}
```

---

### 场景 2：智能读书推荐系统

**背景**：基于用户阅读历史和偏好，构建个性化推荐引擎。

**核心需求**：
- 分析用户阅读偏好
- 生成多维度推荐
- 智能筛选相关书籍
- 支持A/B测试

**实现流程**：

```typescript
interface RecommendationEngine {
  getUserProfile(): Promise<UserProfile>;
  generateRecommendations(profile: UserProfile): Promise<Recommendation[]>;
  rankRecommendations(recommendations: Recommendation[]): Recommendation[];
}

interface UserProfile {
  finishedBooks: BookRecord[];
  readingBooks: BookRecord[];
  favoriteCategories: Map<string, number>;
  favoriteAuthors: Map<string, number>;
  averageRating: number;
  readingFrequency: 'heavy' | 'moderate' | 'light';
}

interface Recommendation {
  bookId: string;
  title: string;
  author: string;
  reason: string;
  score: number;
  source: 'similar' | 'category' | 'author' | 'trending';
}

// 第一步：构建用户画像
async function buildUserProfile(): Promise<UserProfile> {
  const books = await syncShelf();
  const readData = await safeCallWeReadAPI('/readdata/yearreport');
  
  // 分类统计
  const categoryMap = new Map<string, number>();
  const authorMap = new Map<string, number>();
  
  for (const book of books) {
    if (book.status === 'finished') {
      const category = await getBookCategory(book.bookId);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      
      authorMap.set(book.author, (authorMap.get(book.author) || 0) + 1);
    }
  }
  
  const avgRating = books
    .filter(b => b.status === 'finished')
    .reduce((sum, b) => sum + b.rating, 0) / books.length;
  
  return {
    finishedBooks: books.filter(b => b.status === 'finished'),
    readingBooks: books.filter(b => b.status === 'reading'),
    favoriteCategories: categoryMap,
    favoriteAuthors: authorMap,
    averageRating: avgRating,
    readingFrequency: readData.readDays > 300 ? 'heavy' : 
                      readData.readDays > 100 ? 'moderate' : 'light'
  };
}

// 第二步：多维度推荐生成
async function generateRecommendations(
  profile: UserProfile
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  
  // 推荐1：相似书籍
  for (const book of profile.finishedBooks.slice(0, 5)) {
    const similar = await safeCallWeReadAPI(
      '/book/similar',
      { bookId: book.bookId, count: 5 }
    );
    
    for (const similarBook of similar.books) {
      recommendations.push({
        bookId: similarBook.bookId,
        title: similarBook.title,
        author: similarBook.author,
        reason: `因为你喜欢《${book.title}》`,
        score: similarBook.rating * 0.8,
        source: 'similar'
      });
    }
  }
  
  // 推荐2：热门书籍
  const trending = await safeCallWeReadAPI(
    '/book/recommend',
    { count: 10 }
  );
  
  for (const book of trending.books) {
    recommendations.push({
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      reason: trending.reason || '热门推荐',
      score: book.rating * 0.7,
      source: 'trending'
    });
  }
  
  // 推荐3：作者最新作品
  for (const [author, count] of profile.favoriteAuthors) {
    const search = await safeCallWeReadAPI(
      '/store/search',
      { keyword: author, scope: 6, maxIdx: 0 }
    );
    
    for (const result of search.results.slice(0, 3)) {
      recommendations.push({
        bookId: result.bookId,
        title: result.title,
        author: result.author,
        reason: `你关注的作者 ${author} 的新作`,
        score: result.rating * 0.9,
        source: 'author'
      });
    }
  }
  
  return recommendations;
}

// 第三步：推荐排序和去重
function rankRecommendations(
  recommendations: Recommendation[],
  profile: UserProfile
): Recommendation[] {
  // 去重
  const deduped = new Map<string, Recommendation>();
  for (const rec of recommendations) {
    const existing = deduped.get(rec.bookId);
    if (!existing || rec.score > existing.score) {
      deduped.set(rec.bookId, rec);
    }
  }
  
  // 评分调整：考虑用户偏好
  const ranked = Array.from(deduped.values()).map(rec => ({
    ...rec,
    score: adjustScore(rec, profile)
  }));
  
  // 排序
  ranked.sort((a, b) => b.score - a.score);
  
  return ranked;
}

function adjustScore(
  rec: Recommendation,
  profile: UserProfile
): number {
  let score = rec.score;
  
  // 如果是用户喜欢的作者，加分
  if (profile.favoriteAuthors.has(rec.author)) {
    score += 1.0;
  }
  
  // 如果在阅读列表中，减分（已知）
  if (profile.readingBooks.some(b => b.bookId === rec.bookId)) {
    score -= 2.0;
  }
  
  // 如果已读过，大幅减分
  if (profile.finishedBooks.some(b => b.bookId === rec.bookId)) {
    score -= 5.0;
  }
  
  return Math.max(0, score);
}
```

---

### 场景 3：智能笔记整理与知识管理

**背景**：用户积累了大量划线和笔记，需要系统化整理和重新发现。

**核心需求**：
- 按主题聚类笔记
- 提取关键概念
- 生成知识图谱
- 支持全文搜索

**实现流程**：

```typescript
interface NoteOrganization {
  clusters: NotebookCluster[];
  concepts: Concept[];
  knowledgeGraph: KnowledgeNode[];
}

interface NotebookCluster {
  theme: string;
  keywords: string[];
  notes: NotebookRecord[];
  relatedBooks: string[];
}

interface Concept {
  term: string;
  frequency: number;
  relatedNotes: NotebookRecord[];
  definition?: string;
}

// 第一步：获取所有笔记
async function getAllNotebooksWithDetails(
  bookIds: string[]
): Promise<NotebookRecord[]> {
  const allNotes: NotebookRecord[] = [];
  
  for (const bookId of bookIds) {
    let lastSort: number | undefined;
    
    while (true) {
      const res = await safeCallWeReadAPI(
        '/book/bookmarklist',
        { bookId, count: 100, lastSort }
      );
      
      if (res.items) {
        for (const item of res.items) {
          // 获取原文上下文
          const context = await safeCallWeReadAPI(
            '/book/bookmarkdetail',
            { 
              bookId,
              bookmarkId: item.bookmarkId,
              chapterUid: item.chapterUid
            }
          );
          
          allNotes.push({
            bookmarkId: item.bookmarkId,
            bookId,
            chapterUid: item.chapterUid,
            markText: item.markText,
            range: `${item.range.startOffset}-${item.range.endOffset}`,
            type: item.type === 0 ? 'highlight' : 'thought',
            createTime: new Date(item.createTime * 1000),
            context: context.content,
            source: context.source
          });
        }
      }
      
      if (!res.hasMore) break;
      lastSort = res.lastSort;
    }
  }
  
  return allNotes;
}

// 第二步：NLP 分析和聚类
async function clusterNotebooksByTheme(
  notes: NotebookRecord[]
): Promise<NotebookCluster[]> {
  // 使用简单的关键词提取（实际应使用 NLP 库如 jieba、natural）
  const clusters = new Map<string, NotebookCluster>();
  
  const commonKeywords = [
    '人工智能', '机器学习', '深度学习', '神经网络',
    '数据分析', '商业思维', '产品设计', '用户体验',
    '心理学', '认知偏差', '行为决策', '社交动力',
    '历史', '文化', '哲学', '伦理'
  ];
  
  for (const note of notes) {
    let matched = false;
    
    for (const keyword of commonKeywords) {
      if (note.markText.includes(keyword)) {
        if (!clusters.has(keyword)) {
          clusters.set(keyword, {
            theme: keyword,
            keywords: [keyword],
            notes: [],
            relatedBooks: new Set()
          });
        }
        
        const cluster = clusters.get(keyword)!;
        cluster.notes.push(note);
        cluster.relatedBooks.add(note.bookId);
        matched = true;
        break;
      }
    }
    
    // 未匹配的笔记放入"其他"
    if (!matched) {
      if (!clusters.has('其他')) {
        clusters.set('其他', {
          theme: '其他',
          keywords: [],
          notes: [],
          relatedBooks: new Set()
        });
      }
      clusters.get('其他')!.notes.push(note);
      clusters.get('其他')!.relatedBooks.add(note.bookId);
    }
  }
  
  return Array.from(clusters.values());
}

// 第三步：提取核心概念
function extractConcepts(notes: NotebookRecord[]): Concept[] {
  const conceptMap = new Map<string, Concept>();
  
  // 简单的词汇频率分析
  const words = new Map<string, number>();
  
  for (const note of notes) {
    // 分词（实际应使用专业 NLP 库）
    const tokens = note.markText.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    
    for (const token of tokens) {
      words.set(token, (words.get(token) || 0) + 1);
    }
  }
  
  // 取频率前 30 的词作为核心概念
  const topWords = Array.from(words.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);
  
  for (const [term, frequency] of topWords) {
    conceptMap.set(term, {
      term,
      frequency,
      relatedNotes: notes.filter(n => n.markText.includes(term))
    });
  }
  
  return Array.from(conceptMap.values());
}

// 第四步：构建知识图谱
function buildKnowledgeGraph(concepts: Concept[]): KnowledgeNode[] {
  const nodes: KnowledgeNode[] = [];
  const edges: Map<string, Set<string>> = new Map();
  
  // 构建概念关系
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const c1 = concepts[i];
      const c2 = concepts[j];
      
      // 如果两个概念在同一条笔记中出现，则建立关系
      const commonNotes = c1.relatedNotes.filter(n =>
        c2.relatedNotes.some(n2 => n.bookmarkId === n2.bookmarkId)
      );
      
      if (commonNotes.length > 0) {
        if (!edges.has(c1.term)) {
          edges.set(c1.term, new Set());
        }
        edges.get(c1.term)!.add(c2.term);
      }
    }
  }
  
  // 转换为节点格式
  for (const concept of concepts) {
    nodes.push({
      id: concept.term,
      label: concept.term,
      value: concept.frequency,
      relations: Array.from(edges.get(concept.term) || new Set())
    });
  }
  
  return nodes;
}

// 完整工作流
async function organizeNotebook(
  bookIds: string[]
): Promise<NoteOrganization> {
  const notes = await getAllNotebooksWithDetails(bookIds);
  const clusters = await clusterNotebooksByTheme(notes);
  const concepts = extractConcepts(notes);
  const graph = buildKnowledgeGraph(concepts);
  
  return { clusters, concepts, knowledgeGraph: graph };
}
```

---

### 场景 4：社交读书功能开发

**背景**：基于热门划线和用户互动，打造社交读书体验。

**核心需求**：
- 展示章节热门划线
- 获取划线下的讨论
- 排序和过滤热门内容
- 实时通知新回复

**实现流程**：

```typescript
interface HotlineDiscussion {
  bookmarkId: string;
  markText: string;
  bookTitle: string;
  chapterUid: string;
  hotScore: number;
  thoughtCount: number;
  thoughts: UserThought[];
  relatedSnippets: string[];
}

interface UserThought {
  thoughtId: string;
  author: string;
  content: string;
  createTime: Date;
  likes: number;
  replies: UserThought[];
}

// 第一步：获取章节热门划线
async function getChapterHotlines(
  bookId: string,
  chapterUid: string
): Promise<HotlineDiscussion[]> {
  // 获取该章节的所有划线
  const res = await safeCallWeReadAPI(
    '/book/bookmarklist',
    { bookId, chapterUid, count: 100 }
  );
  
  // 获取划线热度
  const underlines = await safeCallWeReadAPI(
    '/book/underlines',
    { bookId, chapterUid }
  );
  
  const discussions: HotlineDiscussion[] = [];
  
  for (const item of res.items || []) {
    const underlineInfo = underlines.find(u => u.bookmarkId === item.bookmarkId);
    
    // 获取划线下的想法（评论）
    const thoughtsRes = await safeCallWeReadAPI(
      '/book/bookmarkthoughts',
      { 
        bookId,
        bookmarkId: item.bookmarkId,
        count: 20
      }
    );
    
    const thoughts = (thoughtsRes.thoughts || []).map(t => ({
      thoughtId: t.thoughtId,
      author: t.author,
      content: t.content,
      createTime: new Date(t.createTime * 1000),
      likes: t.likes || 0,
      replies: t.replies ? t.replies.map(r => ({
        thoughtId: r.thoughtId,
        author: r.author,
        content: r.content,
        createTime: new Date(r.createTime * 1000),
        likes: r.likes || 0,
        replies: []
      })) : []
    }));
    
    discussions.push({
      bookmarkId: item.bookmarkId,
      markText: item.markText,
      bookTitle: '', // 需另外获取
      chapterUid,
      hotScore: underlineInfo?.score || item.likes || 0,
      thoughtCount: thoughts.length,
      thoughts,
      relatedSnippets: [item.markText]
    });
  }
  
  // 按热度排序
  discussions.sort((a, b) => b.hotScore - a.hotScore);
  
  return discussions;
}

// 第二步：构建热门划线feed
async function buildHotlineFeed(
  readingBooks: BookRecord[],
  limit: number = 50
): Promise<HotlineDiscussion[]> {
  const allDiscussions: HotlineDiscussion[] = [];
  
  for (const book of readingBooks) {
    const info = await safeCallWeReadAPI(
      '/book/info',
      { bookId: book.bookId }
    );
    
    // 获取全书TOP热门划线
    const hotlines = await safeCallWeReadAPI(
      '/book/bestbookmarks',
      { bookId: book.bookId, count: 10 }
    );
    
    for (const hl of hotlines.items || []) {
      allDiscussions.push({
        bookmarkId: hl.bookmarkId,
        markText: hl.markText,
        bookTitle: book.title,
        chapterUid: hl.chapterUid,
        hotScore: hl.score || 0,
        thoughtCount: hl.thoughtCount || 0,
        thoughts: [],
        relatedSnippets: [hl.markText]
      });
    }
  }
  
  // 全局排序
  allDiscussions.sort((a, b) => b.hotScore - a.hotScore);
  
  return allDiscussions.slice(0, limit);
}

// 第三步：热门划线分析
interface HotlineAnalytics {
  topThemes: { theme: string; count: number }[];
  topAuthors: { author: string; count: number }[];
  mostDiscussedBooks: { bookId: string; title: string; count: number }[];
  engagementTrend: { date: string; interactions: number }[];
}

async function analyzeHotlines(
  discussions: HotlineDiscussion[]
): Promise<HotlineAnalytics> {
  const themeCount = new Map<string, number>();
  const authorCount = new Map<string, number>();
  const bookCount = new Map<string, number>();
  const engagementByDate = new Map<string, number>();
  
  for (const disc of discussions) {
    // 主题统计（简单的关键词匹配）
    const keywords = ['爱', '死亡', '自由', '真理', '人性'];
    for (const kw of keywords) {
      if (disc.markText.includes(kw)) {
        themeCount.set(kw, (themeCount.get(kw) || 0) + 1);
      }
    }
    
    // 书籍统计
    bookCount.set(
      disc.bookTitle,
      (bookCount.get(disc.bookTitle) || 0) + disc.thoughtCount
    );
    
    // 时间序列
    for (const thought of disc.thoughts) {
      const dateStr = thought.createTime.toISOString().split('T')[0];
      engagementByDate.set(
        dateStr,
        (engagementByDate.get(dateStr) || 0) + 1
      );
    }
  }
  
  return {
    topThemes: Array.from(themeCount.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    
    topAuthors: [], // 需要从用户信息获取
    
    mostDiscussedBooks: Array.from(bookCount.entries())
      .map(([title, count]) => ({ bookId: '', title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    
    engagementTrend: Array.from(engagementByDate.entries())
      .map(([date, interactions]) => ({ date, interactions }))
      .sort((a, b) => a.date.localeCompare(b.date))
  };
}
```

---

## 七、创新功能拓展方案

### 7.1 AI 增强型功能

**利用大模型增强微信读书体验**：

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// 功能1：AI 总结书籍内容
async function generateBookSummary(
  bookId: string,
  maxTokens: number = 500
): Promise<string> {
  const chapters = await safeCallWeReadAPI(
    '/book/chapterinfo',
    { bookId }
  );
  
  const chapterNames = chapters.chapters
    .map(ch => ch.name)
    .slice(0, 20)
    .join(', ');
  
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: `请根据这本书的章节结构，生成一份 500 字以内的内容总结。章节列表：${chapterNames}`
      }
    ]
  });
  
  return message.content[0].type === 'text' ? message.content[0].text : '';
}

// 功能2：AI 生成阅读计划
async function generateReadingPlan(
  bookId: string,
  daysAvailable: number = 30
): Promise<ReadingPlan> {
  const book = await safeCallWeReadAPI('/book/info', { bookId });
  const chapters = await safeCallWeReadAPI(
    '/book/chapterinfo',
    { bookId }
  );
  
  const prompt = `
    我想在 ${daysAvailable} 天内读完《${book.title}》，
    这本书有 ${chapters.chapters.length} 个章节。
    请生成一份详细的阅读计划，包括：
    1. 每天的阅读目标（按章节划分）
    2. 重点章节标注
    3. 复习安排
    4. 笔记建议
  `;
  
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  });
  
  return parseReadingPlan(
    message.content[0].type === 'text' ? message.content[0].text : ''
  );
}

// 功能3：智能笔记扩展
async function expandNotebook(
  noteText: string,
  context: string
): Promise<ExpandedNote> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `
          原文划线："${noteText}"
          
          上下文："${context}"
          
          请：
          1. 解释这段话的含义
          2. 提出两个相关的思考问题
          3. 补充一个实际应用场景
          4. 关联一个哲学或心理学概念
        `
      }
    ]
  });
  
  return {
    originalNote: noteText,
    explanation: '',
    questions: [],
    applications: [],
    relatedConcepts: []
  };
}

// 功能4：阅读风格分析
async function analyzeReadingStyle(
  notebooks: NotebookRecord[],
  profile: UserProfile
): Promise<ReadingStyleAnalysis> {
  const sampleNotes = notebooks.slice(0, 20);
  const noteTexts = sampleNotes.map(n => n.markText).join('\n');
  
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `
          分析这个读者的阅读风格。
          已读书籍分类偏好：${Array.from(profile.favoriteCategories.keys()).join(', ')}
          
          最近的划线/笔记：
          ${noteTexts}
          
          请分析：
          1. 这个读者的阅读风格特点
          2. 主要的思维模式
          3. 推荐的接下来阅读方向
          4. 学习建议
        `
      }
    ]
  });
  
  return {
    styleProfile: message.content[0].type === 'text' ? message.content[0].text : '',
    thinkingPatterns: [],
    recommendedGenres: [],
    learningAdvice: ''
  };
}
```

### 7.2 多端同步方案

```typescript
// 支持微信读书数据跨平台同步

interface SyncStrategy {
  localDb: SQLiteStore;
  remoteBackup: CloudBackup;
  conflictResolver: ConflictResolver;
}

class MultiPlatformSync {
  private lastSyncTime: Map<string, Date> = new Map();
  private syncQueue: SyncTask[] = [];
  
  async syncWithCloud() {
    // 第一步：检查本地变更
    const localChanges = await this.detectLocalChanges();
    
    // 第二步：获取云端最新状态
    const remoteState = await this.fetchRemoteState();
    
    // 第三步：冲突检测与解决
    const conflicts = this.detectConflicts(localChanges, remoteState);
    
    for (const conflict of conflicts) {
      const resolved = await this.resolveConflict(conflict);
      if (resolved.useLocal) {
        await this.uploadToCloud(resolved.local);
      } else {
        await this.updateLocal(resolved.remote);
      }
    }
    
    // 第四步：同步无冲突项
    const nonConflictingLocal = localChanges.filter(
      c => !conflicts.some(cf => cf.id === c.id)
    );
    
    for (const change of nonConflictingLocal) {
      await this.uploadToCloud(change);
    }
  }
  
  private detectLocalChanges() {
    // 查询本地DB中 mtime > lastSyncTime 的记录
  }
  
  private detectConflicts(local: any[], remote: any[]) {
    // 比较 version 和修改时间
  }
  
  private async resolveConflict(
    conflict: { local: any; remote: any }
  ) {
    // 优先级规则：
    // 1. 若一方是删除操作，另一方是修改，则保留修改
    // 2. 比较修改时间，取最新版本
    // 3. 用户确认
    return { useLocal: true, local: conflict.local };
  }
}
```

---

## 八、常见问题与排查

### Q1：为什么获取笔记总是分页不全？

**根本原因**：使用了错误的分页方式。

**❌ 错误示例**：
```typescript
const notes = [];
for (let i = 0; i < 10; i++) {
  const res = await api('/book/bookmarklist', {
    bookId,
    offset: i * 20,  // ❌ 错误，API 不支持 offset
    limit: 20
  });
  notes.push(...res.items);
}
```

**✅ 正确做法**：
```typescript
const notes = [];
let lastSort;

while (true) {
  const res = await api('/book/bookmarklist', {
    bookId,
    count: 20,
    lastSort  // ✅ 使用游标
  });
  
  notes.push(...res.items);
  
  if (!res.hasMore) break;
  lastSort = res.lastSort;  // ✅ 更新游标
}
```

### Q2：API Key 过期或失效怎么办？

**症状**：所有请求返回 `errcode: -1`

**排查步骤**：
```bash
# 1. 检查环境变量
echo $WEREAD_API_KEY

# 2. 验证 API Key 格式
# 正确格式：wrk-xxxxxxxx（前缀 wrk-）

# 3. 测试单个接口
curl -X POST "https://i.weread.qq.com/api/agent/gateway" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api_name": "/user/profile", "skill_version": "1.0.3"}'

# 4. 查看响应错误信息
# 如果是 "认证失败" 或 "token过期"，需要重新申请
```

### Q3：搜索结果为空或不准确？

**常见原因**：
- scope 参数设置错误
- 关键词过于具体或包含特殊字符
- 搜索范围限制

**解决方案**：
```typescript
async function robustSearch(
  keyword: string,
  preferredScope?: number
) {
  const scopes = preferredScope ? [preferredScope] : [0, 10, 12];
  
  for (const scope of scopes) {
    const res = await api('/store/search', {
      keyword,
      scope,
      maxIdx: 0,
      count: 20
    });
    
    if (res.results && res.results.length > 0) {
      return res.results;
    }
  }
  
  // 降级策略：尝试模糊搜索
  const keywords = keyword.split(' ');
  const firstKeyword = keywords[0];
  
  return await api('/store/search', {
    keyword: firstKeyword,
    scope: 0,
    count: 50
  });
}
```

### Q4：为什么某些用户的书架为空？

**原因分析**：
- 用户确实没有购买/收藏任何书籍
- 用户隐私设置限制了书架可见性
- API Key 对应的用户与请求用户不一致

**验证方法**：
```typescript
async function debugShelf(bookId?: string) {
  // 1. 验证用户身份
  const profile = await api('/user/profile');
  console.log("当前用户:", profile.name);
  
  // 2. 获取书架
  const shelf = await api('/shelf/sync', { count: 100 });
  console.log("书架数量:", shelf.books.length + shelf.albums.length);
  
  // 3. 如果为空，尝试直接访问特定书籍
  if (bookId) {
    const book = await api('/book/info', { bookId });
    console.log("是否有权限:", book.haveRead !== undefined);
  }
}
```

---

## 九、最佳实践总结

### 9.1 API 调用规范

| 项目 | 规范 | 示例 |
|------|------|------|
| **参数格式** | 全部平铺，不要嵌套 | `{api_name, bookId, count, lastSort, skill_version}` |
| **版本上报** | 每次请求必须带 | `skill_version: "1.0.3"` |
| **错误处理** | 检查 errcode 和 upgrade_info | 参考 4.5 节 |
| **分页方式** | 使用 lastSort 游标 | 参考 4.3 节 |
| **频率限制** | 建议间隔 100ms | 避免触发限流 |
| **超时设置** | 建议 30-60s | 网络波动时的兜底 |
| **失败重试** | 2-3 次指数退避 | 参考 4.1 节 |

### 9.2 数据安全

```typescript
// 敏感信息不要记录在日志中
const safeLog = (data: any) => {
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // 脱敏 API Key
  if (sanitized.Authorization) {
    sanitized.Authorization = sanitized.Authorization.replace(
      /Bearer wrk-\w+/,
      'Bearer wrk-***'
    );
  }
  
  // 脱敏用户ID
  if (sanitized.userId) {
    sanitized.userId = '***';
  }
  
  console.log(JSON.stringify(sanitized));
};

// API Key 应存储在环境变量或密钥管理系统
const apiKey = process.env.WEREAD_API_KEY;
// 不要硬编码：const apiKey = "wrk-xxx";
```

### 9.3 性能优化

```typescript
// 缓存策略：对不经常变化的数据进行缓存
class CachedWeReadAPI {
  private cache = new Map<string, { data: any; expiry: Date }>();
  private ttl = 3600000; // 1小时
  
  async getBookInfo(bookId: string) {
    const cacheKey = `book:${bookId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (cached.expiry > new Date()) {
        return cached.data;
      }
    }
    
    const data = await safeCallWeReadAPI('/book/info', { bookId });
    
    this.cache.set(cacheKey, {
      data,
      expiry: new Date(Date.now() + this.ttl)
    });
    
    return data;
  }
  
  async getAllNotebooks(userId: string) {
    const allNotebooks: NotebookRecord[] = [];
    let lastSort: number | undefined;
    let hasMore = true;
    
    while (hasMore) {
      const params: any = {
        userId,
        count: 100,
        skill_version: "1.0.3"
      };
      
      if (lastSort) {
        params.lastSort = lastSort;
      }
      
      const response = await safeCallWeReadAPI('/user/notebooks', params);
      
      allNotebooks.push(...response.books);
      lastSort = response.lastSort;
      hasMore = response.hasMore;
      
      // ⭐️ 防止速率限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return allNotebooks;
  }
  
  // 缓存失效方法
  invalidateCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }
}

// 数据导出器
class ReadingDataExporter {
  constructor(private db: Database) {}
  
  async exportToJSON(userId: string): Promise<string> {
    const books = await this.db.query(
      'SELECT * FROM books WHERE user_id = ?',
      [userId]
    );
    
    const notebooks = await this.db.query(
      'SELECT * FROM notebooks WHERE user_id = ?',
      [userId]
    );
    
    const warehouse: ReadingDataWarehouse = {
      userId,
      exportTime: new Date(),
      books: books as BookRecord[],
      notebooks: notebooks as NotebookRecord[],
      readingStats: this.calculateStats(books)
    };
    
    return JSON.stringify(warehouse, null, 2);
  }
  
  async exportToCSV(userId: string): Promise<string> {
    const notebooks = await this.db.query(
      'SELECT * FROM notebooks WHERE user_id = ?',
      [userId]
    );
    
    const rows = [
      ['书籍ID', '书籍名', '章节', '标记类型', '文本内容', '创建时间']
    ];
    
    for (const nb of notebooks) {
      rows.push([
        nb.bookId,
        nb.bookTitle,
        nb.chapterUid,
        nb.type,
        nb.markText.replace(/"/g, '""'),
        new Date(nb.createTime * 1000).toISOString()
      ]);
    }
    
    return rows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
  
  async exportToMarkdown(userId: string): Promise<string> {
    const notebooks = await this.db.query(`
      SELECT n.*, b.title as bookTitle, c.title as chapterTitle
      FROM notebooks n
      JOIN books b ON n.book_id = b.id
      LEFT JOIN chapters c ON n.chapter_uid = c.uid
      WHERE n.user_id = ?
      ORDER BY b.title, n.create_time
    `, [userId]);
    
    let md = `# 阅读笔记导出\n\n`;
    md += `导出时间: ${new Date().toISOString()}\n\n`;
    
    let currentBook = '';
    
    for (const nb of notebooks) {
      if (nb.bookTitle !== currentBook) {
        currentBook = nb.bookTitle;
        md += `## ${currentBook}\n\n`;
      }
      
      md += `### ${nb.chapterTitle || '未知章节'}\n\n`;
      md += `**标记**: ${nb.type === 'highlight' ? '划线' : '笔记'}\n\n`;
      md += `> ${nb.markText}\n\n`;
      md += `时间: ${new Date(nb.createTime * 1000).toLocaleString()}\n\n`;
      md += `---\n\n`;
    }
    
    return md;
  }
  
  private calculateStats(books: BookRecord[]): ReadingStatistics {
    const stats: ReadingStatistics = {
      totalBooks: books.length,
      finishedBooks: books.filter(b => b.status === 'finished').length,
      readingBooks: books.filter(b => b.status === 'reading').length,
      totalReadingTime: books.reduce((sum, b) => sum + b.readingTime, 0),
      averageRating: books.reduce((sum, b) => sum + b.rating, 0) / books.length,
      lastReadTime: new Date(
        Math.max(...books.map(b => b.lastReadTime?.getTime() || 0))
      )
    };
    
    return stats;
  }
}
```

### 场景 2：实时同步与增量更新

**背景**：定期从微信读书同步新增数据，而不是每次都全量导出。

**核心难点**：
- 如何检测数据变化
- 如何高效增量同步
- 如何处理删除操作

**实现方案**：

```typescript
interface SyncCheckpoint {
  lastSyncTime: Date;
  lastNotebookSort: number;
  lastBookUpdateTime: Date;
}

class IncrementalSyncService {
  private checkpointFile = './.weread_sync_checkpoint.json';
  
  private loadCheckpoint(): SyncCheckpoint {
    try {
      const data = fs.readFileSync(this.checkpointFile, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        lastSyncTime: new Date(parsed.lastSyncTime),
        lastNotebookSort: parsed.lastNotebookSort,
        lastBookUpdateTime: new Date(parsed.lastBookUpdateTime)
      };
    } catch {
      return {
        lastSyncTime: new Date(0),
        lastNotebookSort: 0,
        lastBookUpdateTime: new Date(0)
      };
    }
  }
  
  private saveCheckpoint(checkpoint: SyncCheckpoint) {
    fs.writeFileSync(
      this.checkpointFile,
      JSON.stringify(checkpoint, null, 2)
    );
  }
  
  async performIncrementalSync(userId: string) {
    const checkpoint = this.loadCheckpoint();
    const newNotebooks: NotebookRecord[] = [];
    
    console.log(`📖 开始增量同步 (上次同步: ${checkpoint.lastSyncTime.toLocaleString()})`);
    
    // Step 1: 同步新增笔记
    let lastSort = checkpoint.lastNotebookSort;
    let hasMore = true;
    
    while (hasMore) {
      const params: any = {
        userId,
        count: 50,
        skill_version: "1.0.3"
      };
      
      if (lastSort > 0) {
        params.lastSort = lastSort;
      }
      
      const response = await safeCallWeReadAPI('/user/notebooks', params);
      
      // ⭐️ 只获取新增的笔记
      const newItems = response.books.filter((book: any) => {
        return new Date(book.createTime * 1000) > checkpoint.lastSyncTime;
      });
      
      newNotebooks.push(...newItems);
      
      if (!response.hasMore || newItems.length === 0) {
        hasMore = false;
      }
      
      lastSort = response.lastSort;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Step 2: 同步更新的书籍信息
    const params = { userId, count: 100, skill_version: "1.0.3" };
    const booksResponse = await safeCallWeReadAPI('/user/books', params);
    
    const updatedBooks = booksResponse.books.filter((book: any) => {
      return new Date(book.updateTime * 1000) > checkpoint.lastBookUpdateTime;
    });
    
    console.log(`✅ 检测到 ${newNotebooks.length} 条新笔记`);
    console.log(`✅ 检测到 ${updatedBooks.length} 本更新的书籍`);
    
    // Step 3: 存储到数据库
    const db = new Database(':memory:'); // 实际使用真实数据库
    
    for (const notebook of newNotebooks) {
      await db.run(
        `INSERT OR REPLACE INTO notebooks 
        (bookmark_id, book_id, mark_text, create_time, user_id)
        VALUES (?, ?, ?, ?, ?)`,
        [notebook.bookmarkId, notebook.bookId, notebook.markText, 
         notebook.createTime, userId]
      );
    }
    
    for (const book of updatedBooks) {
      await db.run(
        `INSERT OR REPLACE INTO books 
        (book_id, title, progress, reading_time, user_id)
        VALUES (?, ?, ?, ?, ?)`,
        [book.bookId, book.title, book.progress, book.readingTime, userId]
      );
    }
    
    // Step 4: 更新检查点
    const newCheckpoint: SyncCheckpoint = {
      lastSyncTime: new Date(),
      lastNotebookSort: lastSort,
      lastBookUpdateTime: new Date()
    };
    
    this.saveCheckpoint(newCheckpoint);
    
    console.log(`💾 同步完成，已保存检查点`);
    
    return {
      newNotebooks: newNotebooks.length,
      updatedBooks: updatedBooks.length
    };
  }
  
  // 定时同步任务
  startAutoSync(userId: string, intervalMinutes: number = 30) {
    console.log(`⏰ 启动自动同步任务 (间隔: ${intervalMinutes}分钟)`);
    
    setInterval(async () => {
      try {
        await this.performIncrementalSync(userId);
      } catch (error) {
        console.error('同步失败:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}
```

### 场景 3：智能阅读分析与数据可视化

**背景**：基于导出的数据进行深度分析。

**可分析的维度**：
- 阅读进度趋势
- 每本书的关键笔记
- 阅读时间分布
- 常见主题聚类

**实现示例**：

```typescript
interface ReadingAnalysis {
  progressTrend: { date: Date; progress: number }[];
  topHighlights: { text: string; frequency: number }[];
  readingHeatmap: Record<string, number>; // 按小时分布
  authorStatistics: Record<string, number>; // 作者统计
  genreDistribution: Record<string, number>; // 分类分布
}

class ReadingAnalyzer {
  constructor(private db: Database) {}
  
  async analyzeReadingTrend(userId: string): Promise<ReadingAnalysis> {
    // 分析进度趋势
    const progressData = await this.db.query(`
      SELECT 
        DATE(FROM_UNIXTIME(update_time)) as date,
        AVG(progress) as avgProgress
      FROM books
      WHERE user_id = ?
      GROUP BY DATE(FROM_UNIXTIME(update_time))
      ORDER BY date
    `, [userId]);
    
    // 提取高频关键词
    const notebooks = await this.db.query(`
      SELECT mark_text FROM notebooks
      WHERE user_id = ?
      ORDER BY create_time DESC
      LIMIT 1000
    `, [userId]);
    
    const keywordFreq = this.extractKeywords(
      notebooks.map((n: any) => n.mark_text)
    );
    
    // 分析阅读时间分布
    const heatmap = await this.db.query(`
      SELECT 
        HOUR(FROM_UNIXTIME(create_time)) as hour,
        COUNT(*) as count
      FROM notebooks
      WHERE user_id = ?
      GROUP BY HOUR(FROM_UNIXTIME(create_time))
    `, [userId]);
    
    // 作者统计
    const authorStats = await this.db.query(`
      SELECT author, COUNT(*) as bookCount
      FROM books
      WHERE user_id = ?
      GROUP BY author
      ORDER BY bookCount DESC
    `, [userId]);
    
    return {
      progressTrend: progressData,
      topHighlights: keywordFreq.slice(0, 20),
      readingHeatmap: Object.fromEntries(
        heatmap.map((h: any) => [h.hour, h.count])
      ),
      authorStatistics: Object.fromEntries(
        authorStats.map((a: any) => [a.author, a.bookCount])
      ),
      genreDistribution: await this.analyzeGenres(userId)
    };
  }
  
  private extractKeywords(texts: string[]): { text: string; frequency: number }[] {
    const freq = new Map<string, number>();
    
    texts.forEach(text => {
      // 简单分词（实际应用需使用更好的分词库）
      const words = text
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
      
      words.forEach(word => {
        freq.set(word, (freq.get(word) || 0) + 1);
      });
    });
    
    return Array.from(freq.entries())
      .map(([text, frequency]) => ({ text, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  private async analyzeGenres(userId: string): Promise<Record<string, number>> {
    // 这需要使用书籍的分类信息
    const genres = await this.db.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM books
      WHERE user_id = ?
      GROUP BY category
    `, [userId]);
    
    return Object.fromEntries(
      genres.map((g: any) => [g.category, g.count])
    );
  }
  
  // 生成阅读报告
  async generateReport(userId: string): Promise<string> {
    const analysis = await this.analyzeReadingTrend(userId);
    
    let report = `
# 📊 阅读数据分析报告

## 📈 阅读趋势
- 总阅读条目: ${analysis.progressTrend.length}
- 平均每日阅读: ${(analysis.progressTrend.length / 30).toFixed(1)} 条

## 🎯 热词统计
| 关键词 | 出现次数 |
|------|--------|
`;
    
    for (const item of analysis.topHighlights.slice(0, 10)) {
      report += `| ${item.text} | ${item.frequency} |\n`;
    }
    
    report += `\n## 🕐 阅读时间分布\n`;
    for (const [hour, count] of Object.entries(analysis.readingHeatmap)) {
      report += `- ${hour}点: ${'█'.repeat(Math.ceil(count / 5))}\n`;
    }
    
    report += `\n## 👨‍✍️ 作者排行\n`;
    const authorEntries = Object.entries(analysis.authorStatistics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [author, count] of authorEntries) {
      report += `- ${author}: ${count} 本\n`;
    }
    
    return report;
  }
}
```

---

## 七、常见问题与调试技巧

### Q1: API返回 errcode = -1，如何修复？

```typescript
// ❌ 症状: 所有请求都返回 { errcode: -1, errmsg: "未授权" }

// 检查清单:
async function diagnoseAuthError() {
  const checks = {
    // 1. 检查环境变量
    apiKeyExists: !!process.env.WEREAD_API_KEY,
    apiKeyLength: process.env.WEREAD_API_KEY?.length,
    
    // 2. 检查格式
    hasValidPrefix: process.env.WEREAD_API_KEY?.startsWith('weread_'),
    
    // 3. 检查是否过期
    async checkExpiry() {
      try {
        const response = await fetch(gateway, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WEREAD_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            api_name: '/auth/check',
            skill_version: '1.0.3'
          })
        });
        const data = await response.json();
        return data.errcode === 0;
      } catch {
        return false;
      }
    }
  };
  
  console.table(checks);
  
  // 如果全部失败，需要重新申请 API Key
  return checks;
}
```

### Q2: 分页参数 lastSort 如何正确使用？

```typescript
// ❌ 常见错误
const wrongPagination = async () => {
  const res1 = await api.getBooks({ pageSize: 20 }); // 无效
  const res2 = await api.getBooks({ offset: 20, limit: 20 }); // 无效
  const res3 = await api.getBooks({ pageNum: 2 }); // 无效
};

// ✅ 正确用法
const correctPagination = async () => {
  // 第一页
  const res1 = await api.getBooks({ count: 20 });
  // res1.lastSort = 1234567890
  
  // 第二页
  const res2 = await api.getBooks({ count: 20, lastSort: res1.lastSort });
  // res2.lastSort = 1234567880
  
  // 继续分页...
  const res3 = await api.getBooks({ count: 20, lastSort: res2.lastSort });
};
```

### Q3: 时间戳单位错误导致数据混乱

```typescript
// ❌ 常见错误：混淆秒和毫秒
const wrongTime = () => {
  const timestamp = 1701158400; // 秒级时间戳
  const date = new Date(timestamp); // ❌ 被当成毫秒处理
  console.log(date); // Thu Jan 01 1970 ...（错误）
};

// ✅ 正确做法
const correctTime = () => {
  const timestamp = 1701158400; // 秒级
  const date = new Date(timestamp * 1000); // 转换为毫秒
  console.log(date); // Fri Nov 18 2023 ...（正确）
};

// 工具函数
function parseWeReadTime(secondsTimestamp: number): Date {
  // 验证时间戳合理性
  if (secondsTimestamp < 946684800) { // 2000-01-01
    throw new Error('时间戳异常小');
  }
  if (secondsTimestamp > Date.now() / 1000) { // 未来时间
    console.warn('时间戳超过当前时间');
  }
  
  return new Date(secondsTimestamp * 1000);
}
```

### Q4: 如何处理API速率限制？

```typescript
class RateLimiter {
  private requestTimes: number[] = [];
  private maxRequests = 100;
  private windowMs = 60000; // 1分钟
  
  async waitIfNeeded() {
    const now = Date.now();
    
    // 清理超出时间窗口的请求记录
    this.requestTimes = this.requestTimes.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      console.warn(`⏳ 触发速率限制，等待 ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requestTimes.push(now);
  }
  
  async callAPI<T>(
    apiName: string,
    params: any
  ): Promise<T> {
    await this.waitIfNeeded();
    return safeCallWeReadAPI(apiName, params);
  }
}

// 使用示例
const limiter = new RateLimiter();

for (let i = 0; i < 150; i++) {
  const book = await limiter.callAPI('/book/info', { bookId: 3300010569 });
  console.log(`✅ 第 ${i+1} 个请求完成`);
}
```

---

## 八、性能优化与最佳实践

### 8.1 并发请求控制

```typescript
class ConcurrencyPool {
  private running = 0;
  private queue: Array<() => Promise<any>> = [];
  
  constructor(private maxConcurrency: number = 5) {}
  
  async run<T>(task: () => Promise<T>): Promise<T> {
    while (this.running >= this.maxConcurrency) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.running++;
    
    try {
      return await task();
    } finally {
      this.running--;
    }
  }
  
  // 批量处理
  async runAll<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(tasks.map(task => this.run(task)));
  }
}

// 使用: 限制同时只有5个API请求
const pool = new ConcurrencyPool(5);

const bookIds = [3300010569, 3300010570, 3300010571];
const tasks = bookIds.map(id => () =>
  safeCallWeReadAPI('/book/info', { bookId: id })
);

const results = await pool.runAll(tasks);
```

### 8.2 数据库查询优化

```typescript
// ❌ N+1查询问题
const slowQuery = async (userId: string) => {
  const books = await db.query(
    'SELECT * FROM books WHERE user_id = ?',
    [userId]
  );
  
  for (const book of books) {
    // 每本书查一次，总共 N+1 次查询
    const notebooks = await db.query(
      'SELECT * FROM notebooks WHERE book_id = ?',
      [book.id]
    );
    book.notebooks = notebooks;
  }
  
  return books;
};

// ✅ 使用 JOIN 一次查询
const optimizedQuery = async (userId: string) => {
  return db.query(`
    SELECT b.*, COUNT(n.id) as notebook_count
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.user_id = ?
    GROUP BY b.id
  `, [userId]);
};
```

### 8.3 内存使用优化（流式处理大数据）

```typescript
async function* streamNotebooks(userId: string) {
  let lastSort: number | undefined;
  let hasMore = true;
  
  while (hasMore) {
    const params: any = {
      userId,
      count: 100,
      skill_version: "1.0.3"
    };
    
    if (lastSort) {
      params.lastSort = lastSort;
    }
    
    const response = await safeCallWeReadAPI('/user/notebooks', params);
    
    // ⭐️ 使用 yield 逐条返回，而不是一次性加载到内存
    for (const notebook of response.books) {
      yield notebook;
    }
    
    lastSort = response.lastSort;
    hasMore = response.hasMore;
  }
}

// 使用生成器逐条处理
async function processAllNotebooks(userId: string) {
  for await (const notebook of streamNotebooks(userId)) {
    // 处理每一条笔记
    await db.run(
      'INSERT INTO notebooks (...) VALUES (...)',
      [...]
    );
  }
}
```

---

## 九、完整工程化示例

**项目结构**：

```
weread-api-client/
├── src/
│   ├── api/
│   │   ├── client.ts          # API 客户端
│   │   ├── types.ts           # 类型定义
│   │   └── errors.ts          # 错误处理
│   ├── storage/
│   │   ├── database.ts        # 数据库层
│   │   └── cache.ts           # 缓存层
│   ├── sync/
│   │   ├── incremental.ts     # 增量同步
│   │   └── checkpoint.ts      # 同步检查点
│   ├── export/
│   │   ├── exporter.ts        # 数据导出
│   │   └── formats/           # 导出格式
│   ├── analysis/
│   │   └── analyzer.ts        # 数据分析
│   └── index.ts               # 主入口
├── tests/
├── .env.example
└── package.json
```

**核心文件示例**：

```typescript
// src/index.ts - 主入口
import { WeReadClient } from './api/client';
import { DatabaseStorage } from './storage/database';
import { IncrementalSync } from './sync/incremental';
import { ReadingDataExporter } from './export/exporter';
import { ReadingAnalyzer } from './analysis/analyzer';

export class WeReadApp {
  private client: WeReadClient;
  private storage: DatabaseStorage;
  private sync: IncrementalSync;
  private exporter: ReadingDataExporter;
  private analyzer: ReadingAnalyzer;
  
  constructor(apiKey: string, dbPath: string) {
    this.client = new WeReadClient(apiKey);
    this.storage = new DatabaseStorage(dbPath);
    this.sync = new IncrementalSync(this.client, this.storage);
    this.exporter = new ReadingDataExporter(this.storage);
    this.analyzer = new ReadingAnalyzer(this.storage);
  }
  
  async initialize() {
    await this.storage.init();
  }
  
  async sync(userId: string) {
    return this.sync.performIncrementalSync(userId);
  }
  
  async export(userId: string, format: 'json' | 'csv' | 'markdown') {
    switch (format) {
      case 'json':
        return this.exporter.exportToJSON(userId);
      case 'csv':
        return this.exporter.exportToCSV(userId);
      case 'markdown':
        return this.exporter.exportToMarkdown(userId);
    }
  }
  
  async analyze(userId: string) {
    return this.analyzer.analyzeReadingTrend(userId);
  }
}

// 使用示例
const app = new WeReadApp(
  process.env.WEREAD_API_KEY!,
  './weread.db'
);

await app.initialize();
await app.sync('user_123');
const report = await app.analyze('user_123');
const exported = await app.export('user_123', 'markdown');
```

---

## 十、总结与检查清单

**必须记住的关键点**：

✅ **时间戳是秒级不是毫秒级**  
✅ **分页使用 lastSort 游标而非 offset/limit**  
✅ **必须处理 upgrade_info 版本升级信息**  
✅ **errcode 为 0 才表示成功**  
✅ **实施速率限制和重试机制**  
✅ **使用缓存减少API调用**  
✅ **增量同步需要保存检查点**  
✅ **并发请求需要控制**  

**上线前检查**：

- [ ] 所有 API 调用都包装了错误处理
- [ ] 实现了重试机制
- [ ] 配置了请求超时
- [ ] 使用了数据缓存
- [ ] 实现了速率限制
- [ ] 测试了网络不稳定场景
- [ ] 配置了日志输出
- [ ] 实现了数据备份

这就是微信读书 API 的完整使用指南！🎉
```