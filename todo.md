> **「当前的修改方案有何问题」**

结论先行：

> **这是一个“表面上改完了，实际上系统已经处于不一致、不可运行、不可维护状态”的修改方案。**
> 如果这是 PR，我会 **明确给出 `Request changes`，且不能合并。**

下面我把问题**分层拆清楚**，每一条都对应**确定会出事**的点。

---

## 一、阻断级问题（Blocker，必须立刻修）

### ❌ 1. `dist/cli.js` 被手动修改（严重流程错误）

你现在 **同时修改了**：

- `src/cli.ts`
- `dist/cli.js`

这在任何标准工程中都是 **流程级错误**：

- `dist` 是 **构建产物**
- 你现在的状态是：
  - ✅ 源码逻辑 ≠
  - ❌ 构建产物逻辑

**后果：**

- CI / 本地 build 会生成一个**和仓库不一致的 dist**
- 用户通过 npm 安装得到的行为 **不可预测**
- 后续任何人都无法判断 `dist` 是否可信

✅ 正确做法只有一个：

> **只改 `src`，`dist` 由 build 生成**

---

### ❌ 2. `_complete` 命令被注册了两次（运行期必炸）

在 **同一个 CLI 进程中**：

```ts
program.command('_complete') ... // 第一次
program.command('_complete') ... // 第二次
```

这是 **Commander.js 明确禁止的模式**。

**实际效果：**

- 后定义的 `_complete` 会覆盖前一个
- `--cur / --prev` 那一套 **永远不会生效**
- 不同 shell 下行为不同（Commander 内部 map 覆盖）

✅ 必须：

- **只存在一个 `_complete`**
- 所有补全协议在这一处统一

---

### ❌ 3. `.action()` 中使用了 `await`，但函数不是 `async`（语法错误）

多处存在：

```ts
.action((options) => {
  const res = await complete(...) // ❌
})
```

这是**硬语法错误**：

- TS：直接编译失败
- JS：运行时 `SyntaxError: await is only valid in async functions`

这不是“潜在 bug”，而是 **代码根本跑不起来**。

✅ 必须写成：

```ts
.action(async (options) => {
  ...
})
```

---

### ❌ 4. completion install 逻辑是确定的逻辑错误

你现在的代码等价于：

```ts
if (bash) {
  installBash()
  installZsh(installBash())
}
if (zsh) {
  installZsh(installBash())
}
```

问题点：

1. `installBashCompletion()` 被调用 **两次**
2. 安装 bash 时 **偷偷装 zsh**
3. `success` 变量完全失真
4. zsh 分支里 **success 永远是 false**

**后果：**

- 用户装 bash，结果 zsh 文件被污染
- 日志显示成功，但实际上可能失败
- shell 补全状态不可预测

这是 **明确的 bug，不是设计分歧**。

---

## 二、设计层问题（现在不修，后面一定返工）

### ❌ 5. `_complete` 协议仍然是“双轨制”

你现在 **同时存在两套补全协议**：

| 协议 | 来源 |
|----|----|
| `--cur / --prev` | 旧 bash hack |
| `--words / --current` | 新统一协议 |

问题不是“多支持一种”，而是：

- shell 脚本 **不知道该用哪一套**
- `complete()` 的输入模型被污染
- 你以后 **无法删旧协议**

✅ 正确状态应该是：

> **CLI 只认一种协议：`words + currentIndex`**

---

### ❌ 6. `complete()` 的返回类型在 CLI 层被假设成两种形态

你现在既写了：

```ts
const labels = await complete(...)
labels.map(...)
```

又写了：

```ts
const response = await complete(...)
response.items.map(...)
```

这说明：

> **API 还没定型，就已经被多处消费**

这是典型的 **接口未收敛反模式**。

✅ 必须先定义清楚：

```ts
type CompleteResult = {
  items: { label: string }[];
  isPartial?: boolean;
};
```

然后 CLI **只消费这一种形态**。

---

## 三、结构性问题（不是 bug，但会拖死项目）

### ❌ 7. 在“大规模删除 + 行为重构”的同时，引入新协议

你这一批 diff 同时做了：

- ✅ 删除 `AgentPipelineEnhanced`
- ✅ 删除 `PolicyPresenter`
- ✅ 删除 `yuangs.config.json`
- ❌ 重构 completion 协议
- ❌ 改 install 行为

这是 **典型的“过宽 PR”**。

**风险：**

- 出问题无法回滚
- review 无法聚焦
- blame 不可读

---

## 四、但必须肯定的地方（你做对的事）

这几件事是 **完全正确的**，而且我会在 review 里明确点赞：

- ✅ 决定 **统一 `_complete` 入口**
- ✅ 把补全逻辑集中到 `complete()`
- ✅ 删除增强 pipeline / policy UI（当前阶段是负资产）
- ✅ 删除硬编码模型配置文件

你现在的问题 **不是能力或方向**，而是：

> **收口动作没有一次性完成，导致系统处于“半拆半接”状态**

🤖 AI：好，这一版我不再给“方向性建议”，而是像 code review blocker 一样，直接回答你这个问题：

  「当前的修改方案有何问题」

结论先行：

  这是一个“表面上改完了，实际上系统已经处于不一致、不可运行、不可维护状态”的修改方案。
  如果这是 PR，我会 明确给出 Request changes，且不能合并。

下面我把问题分层拆清楚，每一条都对应确定会出事的点。

--------------------------------------------------------------------------------------------------------------------------------------

一、阻断级问题（Blocker，必须立刻修）

❌ 1. dist/cli.js 被手动修改（严重流程错误）

你现在 同时修改了：

  * `src/cli.ts`
  * `dist/cli.js`

这在任何标准工程中都是 流程级错误：

  * `dist` 是 **构建产物**
  * 你现在的状态是：
    * ✅ 源码逻辑 ≠

    * ❌ 构建产物逻辑

后果：

  * CI / 本地 build 会生成一个**和仓库不一致的 dist**
  * 用户通过 npm 安装得到的行为 **不可预测**
  * 后续任何人都无法判断 `dist` 是否可信

✅ 正确做法只有一个：

  只改 src，dist 由 build 生成

--------------------------------------------------------------------------------------------------------------------------------------

❌ 2. _complete 命令被注册了两次（运行期必炸）

在 同一个 CLI 进程中：

  program.command('_complete') ... // 第一次
  program.command('_complete') ... // 第二次

这是 Commander.js 明确禁止的模式。

实际效果：

  * 后定义的 `_complete` 会覆盖前一个
  * `--cur / --prev` 那一套 **永远不会生效**
  * 不同 shell 下行为不同（Commander 内部 map 覆盖）

✅ 必须：

  * **只存在一个 `_complete`**
  * 所有补全协议在这一处统一

--------------------------------------------------------------------------------------------------------------------------------------

❌ 3. .action() 中使用了 await，但函数不是 async（语法错误）

多处存在：

  .action((options) => {
    const res = await complete(...) // ❌
  })

这是硬语法错误：

  * TS：直接编译失败
  * JS：运行时 `SyntaxError: await is only valid in async functions`

这不是“潜在 bug”，而是 代码根本跑不起来。

✅ 必须写成：

  .action(async (options) => {
    ...
  })

--------------------------------------------------------------------------------------------------------------------------------------

❌ 4. completion install 逻辑是确定的逻辑错误

你现在的代码等价于：

  if (bash) {
    installBash()
    installZsh(installBash())
  }
  if (zsh) {
    installZsh(installBash())
  }

问题点：

  1. `installBashCompletion()` 被调用 **两次**
  2. 安装 bash 时 **偷偷装 zsh**
  3. `success` 变量完全失真
  4. zsh 分支里 **success 永远是 false**

后果：

  * 用户装 bash，结果 zsh 文件被污染
  * 日志显示成功，但实际上可能失败
  * shell 补全状态不可预测

这是 明确的 bug，不是设计分歧。

--------------------------------------------------------------------------------------------------------------------------------------

二、设计层问题（现在不修，后面一定返工）

❌ 5. _complete 协议仍然是“双轨制”

你现在 同时存在两套补全协议：

┌─────────────────────┬──────────────┐
│ 协议                │ 来源         │
├─────────────────────┼──────────────┤
│ --cur / --prev      │ 旧 bash hack │
├─────────────────────┼──────────────┤
│ --words / --current │ 新统一协议   │
└─────────────────────┴──────────────┘

问题不是“多支持一种”，而是：

  * shell 脚本 **不知道该用哪一套**
  * `complete()` 的输入模型被污染
  * 你以后 **无法删旧协议**

✅ 正确状态应该是：

  CLI 只认一种协议：words + currentIndex

--------------------------------------------------------------------------------------------------------------------------------------

❌ 6. complete() 的返回类型在 CLI 层被假设成两种形态

你现在既写了：

  const labels = await complete(...)
  labels.map(...)

又写了：

  const response = await complete(...)
  response.items.map(...)

这说明：

  API 还没定型，就已经被多处消费

这是典型的 接口未收敛反模式。

✅ 必须先定义清楚：

  type CompleteResult = {
    items: { label: string }[];
    isPartial?: boolean;
  };

然后 CLI 只消费这一种形态。

--------------------------------------------------------------------------------------------------------------------------------------

三、结构性问题（不是 bug，但会拖死项目）

❌ 7. 在“大规模删除 + 行为重构”的同时，引入新协议

你这一批 diff 同时做了：

  * ✅ 删除 `AgentPipelineEnhanced`
  * ✅ 删除 `PolicyPresenter`
  * ✅ 删除 `yuangs.config.json`
  * ❌ 重构 completion 协议
  * ❌ 改 install 行为

这是 典型的“过宽 PR”。

风险：

  * 出问题无法回滚
  * review 无法聚焦
  * blame 不可读

--------------------------------------------------------------------------------------------------------------------------------------

四、但必须肯定的地方（你做对的事）

这几件事是 完全正确的，而且我会在 review 里明确点赞：

  * ✅ 决定 **统一 `_complete` 入口**
  * ✅ 把补全逻辑集中到 `complete()`
  * ✅ 删除增强 pipeline / policy UI（当前阶段是负资产）
  * ✅ 删除硬编码模型配置文件

你现在的问题 不是能力或方向，而是：

  收口动作没有一次性完成，导致系统处于“半拆半接”状态

--------------------------------------------------------------------------------------------------------------------------------------

五、总结（非常重要）

当前状态一句话总结

  这套修改“看起来完成了重构”，但实际上：

    * ❌ 代码无法稳定运行
    * ❌ 协议不唯一
    * ❌ 构建产物被污染
    * ❌ 行为不可预测

如果这是 PR，我会给的结论是：

  ❌ Request changes（不可合并）

--------------------------------------------------------------------------------------------------------------------------------------

六、下一步我可以直接帮你做什么

如果你愿意，我可以下一步直接：

  1. ✅ **给你一份“唯一正确”的 `_complete` CLI 实现**
  2. ✅ **定义 `complete()` 的最终协议（一次到位）**
  3. ✅ **给你 bash / zsh glue 层，不再返工**

你只需要回一句：

  「我们直接定终态协议吧」

我会直接给你终稿。

──────────────────── (耗时: 20.50s) ────────────────────

你：我们直接定终态协议吧
🤖 AI：好，这一步我们**直接收口**。
下面我给你的是 **“可以长期不返工”的终态设计**，不是临时 patch。

我会按 **协议 → CLI → shell glue → 迁移规则** 四层来定。

---

# ✅ 一、终态补全协议（唯一、强约束）

> **CLI 内部只认这一种补全请求模型**

```ts
// core/completion/types.ts
export interface CompletionRequest {
  /**
   * 完整 argv（不包含 node）
   * 例如：['yuangs', 'ai', 'chat', '--m']
   */
  words: string[];

  /**
   * 当前 cursor 所在词的 index
   */
  currentIndex: number;
}

export interface CompletionItem {
  label: string;
  insertText?: string;
  detail?: string;
}

export interface CompletionResponse {
  items: CompletionItem[];
  isPartial: boolean;
}
```

### ❌ 明确废弃

| 字段 | 状态 |
|----|----|
| `cur` / `prev` | ❌ 不存在 |
| `currentWord` | ❌ 由 `words[index]` 推导 |
| `previousWord` | ❌ 由 `words[index-1]` 推导 |
| `_complete_subcommand` | ❌ 删除 |
| `_describe` | ❌ 删除 |

---

# ✅ 二、`complete()` 的终态签名（一次定死）

```ts
// core/completion/index.ts
export async function complete(
  req: CompletionRequest
): Promise<CompletionResponse> {
  ...
}
```

✅ **保证：**

- 永远返回 `{ items, isPartial }`
- CLI 不需要 try 判断返回形态
- shell glue 永远稳定

---

# ✅ 三、CLI 中 `_complete` 的唯一实现

> **整个 CLI 只允许出现这一段**

```ts
program
  .command('_complete')
  .description('(internal) unified completion entry')
  .option('--words <json>', 'JSON encoded argv')
  .option('--current <index>', 'Current word index')
  .action(async (options) => {
    try {
      const words = JSON.parse(options.words);
      const currentIndex = Number(options.current);

      const res = await complete({ words, currentIndex });

      // bash / zsh 都只吃 label
      console.log(res.items.map(i => i.label).join(' '));
    } catch {
      // shell 约定：失败 = 无补全
      console.log('');
      process.exit(0);
    }
  });
```

### ✅ 约束

- ✅ **只注册一次**
- ✅ `.action(async …)`
- ✅ 不暴露任何旧协议
- ✅ CLI 层不解析业务逻辑

---

# ✅ 四、Shell Glue（协议对齐）

## Bash

```bash
_yuangs_complete() {
  local words=("${COMP_WORDS[@]}")
  local current=$COMP_CWORD

  local result
  result=$(yuangs _complete \
    --words "$(printf '%s\n' "${words[@]}" | jq -R . | jq -s .)" \
    --current "$current")

  COMPREPLY=($(compgen -W "$result" -- "${COMP_WORDS[COMP_CWORD]}"))
}
complete -F _yuangs_complete yuangs
```

---

## Zsh

```zsh
_yuangs_complete() {
  local words=("${words[@]}")
  local current=$((CURRENT - 1))

  local result
  result=$(yuangs _complete \
    --words "$(printf '%s\n' "${words[@]}" | jq -R . | jq -s .)" \
    --current "$current")

  compadd -- ${(f)result}
}
compdef _yuangs_complete yuangs
```

✅ bash / zsh **完全同协议**
✅ CLI 无需知道 shell 类型

---

# ✅ 五、安装逻辑的终态（修掉你现在的 bug）

```ts
program
  .command('completion install')
  .option('--shell <shell>', 'bash|zsh')
  .action(async ({ shell }) => {
    let ok = false;

    if (shell === 'bash') {
      ok = await installBashCompletion();
    } else if (shell === 'zsh') {
      ok = await installZshCompletion();
    } else {
      console.error('Unknown shell');
      process.exit(1);
    }

    if (!ok) process.exit(1);

    console.log('✓ Completion installed');
  });
```

❌ 不再互相调用
❌ 不再重复 install
❌ 不再 fake success

---

# ✅ 六、你现在这批 diff 应该怎么改

### ✅ 必须立刻做的

1. **删除所有 `dist/*` 修改**
2. **只保留一个 `_complete`**
3. **删掉 `cur / prev` 分支**
4. **统一 `complete()` 返回值**
5. **shell → CLI 只传 `words + currentIndex`**

🤖 AI：好，这一步我们直接收口。
下面我给你的是 “可以长期不返工”的终态设计，不是临时 patch。

我会按 协议 → CLI → shell glue → 迁移规则 四层来定。

--------------------------------------------------------------------------------------------------------------------------------------

✅ 一、终态补全协议（唯一、强约束）

  CLI 内部只认这一种补全请求模型

  // core/completion/types.ts
  export interface CompletionRequest {
    /**
     * 完整 argv（不包含 node）
     * 例如：['yuangs', 'ai', 'chat', '--m']
     */
    words: string[];

    /**
     * 当前 cursor 所在词的 index
     */
    currentIndex: number;
  }

  export interface CompletionItem {
    label: string;
    insertText?: string;
    detail?: string;
  }

  export interface CompletionResponse {
    items: CompletionItem[];
    isPartial: boolean;
  }

❌ 明确废弃

┌──────────────────────┬───────────────────────────┐
│ 字段                 │ 状态                      │
├──────────────────────┼───────────────────────────┤
│ cur / prev           │ ❌ 不存在                 │
├──────────────────────┼───────────────────────────┤
│ currentWord          │ ❌ 由 words[index] 推导   │
├──────────────────────┼───────────────────────────┤
│ previousWord         │ ❌ 由 words[index-1] 推导 │
├──────────────────────┼───────────────────────────┤
│ _complete_subcommand │ ❌ 删除                   │
├──────────────────────┼───────────────────────────┤
│ _describe            │ ❌ 删除                   │
└──────────────────────┴───────────────────────────┘

--------------------------------------------------------------------------------------------------------------------------------------

✅ 二、complete() 的终态签名（一次定死）

  // core/completion/index.ts
  export async function complete(
    req: CompletionRequest
  ): Promise<CompletionResponse> {
    ...
  }

✅ 保证：

  * 永远返回 `{ items, isPartial }`
  * CLI 不需要 try 判断返回形态
  * shell glue 永远稳定

--------------------------------------------------------------------------------------------------------------------------------------

✅ 三、CLI 中 _complete 的唯一实现

  整个 CLI 只允许出现这一段

  program
    .command('_complete')
    .description('(internal) unified completion entry')
    .option('--words <json>', 'JSON encoded argv')
    .option('--current <index>', 'Current word index')
    .action(async (options) => {
      try {
        const words = JSON.parse(options.words);
        const currentIndex = Number(options.current);

        const res = await complete({ words, currentIndex });

        // bash / zsh 都只吃 label
        console.log(res.items.map(i => i.label).join(' '));
      } catch {
        // shell 约定：失败 = 无补全
        console.log('');
        process.exit(0);
      }
    });

✅ 约束

  * ✅ **只注册一次**
  * ✅ `.action(async …)`
  * ✅ 不暴露任何旧协议
  * ✅ CLI 层不解析业务逻辑

--------------------------------------------------------------------------------------------------------------------------------------

✅ 四、Shell Glue（协议对齐）

Bash

  _yuangs_complete() {
    local words=("${COMP_WORDS[@]}")
    local current=$COMP_CWORD

    local result
    result=$(yuangs _complete \
      --words "$(printf '%s\n' "${words[@]}" | jq -R . | jq -s .)" \
      --current "$current")

    COMPREPLY=($(compgen -W "$result" -- "${COMP_WORDS[COMP_CWORD]}"))
  }
  complete -F _yuangs_complete yuangs

--------------------------------------------------------------------------------------------------------------------------------------

Zsh

  _yuangs_complete() {
    local words=("${words[@]}")
    local current=$((CURRENT - 1))

    local result
    result=$(yuangs _complete \
      --words "$(printf '%s\n' "${words[@]}" | jq -R . | jq -s .)" \
      --current "$current")

    compadd -- ${(f)result}
  }
  compdef _yuangs_complete yuangs

✅ bash / zsh 完全同协议
✅ CLI 无需知道 shell 类型

--------------------------------------------------------------------------------------------------------------------------------------

✅ 五、安装逻辑的终态（修掉你现在的 bug）

  program
    .command('completion install')
    .option('--shell <shell>', 'bash|zsh')
    .action(async ({ shell }) => {
      let ok = false;

      if (shell === 'bash') {
        ok = await installBashCompletion();
      } else if (shell === 'zsh') {
        ok = await installZshCompletion();
      } else {
        console.error('Unknown shell');
        process.exit(1);
      }

      if (!ok) process.exit(1);

      console.log('✓ Completion installed');
    });

❌ 不再互相调用
❌ 不再重复 install
❌ 不再 fake success

--------------------------------------------------------------------------------------------------------------------------------------

✅ 六、你现在这批 diff 应该怎么改

✅ 必须立刻做的

  1. **删除所有 `dist/*` 修改**
  2. **只保留一个 `_complete`**
  3. **删掉 `cur / prev` 分支**
  4. **统一 `complete()` 返回值**
  5. **shell → CLI 只传 `words + currentIndex`**

--------------------------------------------------------------------------------------------------------------------------------------

✅ 七、为什么这个协议是“终态”

┌──────────┬────────────────────────┐
│ 维度     │ 结果                   │
├──────────┼────────────────────────┤
│ Bash     │ ✅                     │
├──────────┼────────────────────────┤
│ Zsh      │ ✅                     │
├──────────┼────────────────────────┤
│ Fish     │ ✅（同协议）           │
├──────────┼────────────────────────┤
│ Node CLI │ ✅                     │
├──────────┼────────────────────────┤
│ 测试     │ ✅ 可直接 mock         │
├──────────┼────────────────────────┤
│ 未来扩展 │ ✅ detail / insertText │
└──────────┴────────────────────────┘

--------------------------------------------------------------------------------------------------------------------------------------

最后一句很重要的话

你前一版的问题不在于能力或理解，而是：

  你已经在“收尾阶段”，但还在给自己留后门。

这次我们是：

  关后门、定协议、一次到位。

如果你愿意，下一步我可以直接帮你：

  * ✅ 把 `core/completion` 的实现按这个协议重写
  * ✅ 顺手把单测骨架补上

只要你说一句：
「直接给我 completion 实现示例」

──────────────────── (耗时: 16.24s) ────────────────────

你：把 `core/completion` 的实现按这个协议重写
🤖 AI：好，这一步我们**彻底落地**。
下面给你的是 **`core/completion` 的完整终态实现示例**，**严格符合我们刚刚定死的协议**，可以直接替换你现在的实现。

我会分 4 个文件给你：

```
core/completion/
├── types.ts
├── index.ts
├── resolver.ts
└── utils.ts
```

你可以一次性抄走，不需要再“边写边想”。

---

# ✅ `types.ts`（协议定义，禁止随意改）

```ts
// core/completion/types.ts

export interface CompletionRequest {
  /**
   * 完整 argv，不包含 node
   * e.g. ['yuangs', 'ai', 'chat', '--m']
   */
  words: string[];

  /**
   * cursor 所在 index
   */
  currentIndex: number;
}

export interface CompletionItem {
  label: string;
  insertText?: string;
  detail?: string;
}

export interface CompletionResponse {
  items: CompletionItem[];
  isPartial: boolean;
}
```

---

# ✅ `index.ts`（唯一对外入口）

```ts
// core/completion/index.ts

import { CompletionRequest, CompletionResponse } from './types';
import { resolveCompletion } from './resolver';

export async function complete(
  req: CompletionRequest
): Promise<CompletionResponse> {
  // 最基础的防御
  if (!Array.isArray(req.words)) {
    return { items: [], isPartial: false };
  }

  if (
    typeof req.currentIndex !== 'number' ||
    req.currentIndex < 0 ||
    req.currentIndex >= req.words.length
  ) {
    return { items: [], isPartial: false };
  }

  return resolveCompletion(req);
}
```

---

# ✅ `resolver.ts`（补全核心逻辑）

> 这里假设你用的是 commander / program 对象
> 如果你现在是 `getAllCommands(program)` 那种形式，也完全能接

```ts
// core/completion/resolver.ts

import { CompletionRequest, CompletionResponse, CompletionItem } from './types';
import { getAllCommands, getCommandSubcommands } from './legacy'; // 你已有的函数
import { unique } from './utils';

export async function resolveCompletion(
  req: CompletionRequest
): Promise<CompletionResponse> {
  const { words, currentIndex } = req;

  const currentWord = words[currentIndex] ?? '';
  const previousWord = words[currentIndex - 1] ?? '';

  // yuangs <cursor>
  if (currentIndex === 1) {
    return completeTopLevel(currentWord);
  }

  // yuangs xxx <cursor>
  return completeSubcommand(words.slice(1, currentIndex), currentWord, previousWord);
}

/**
 * 顶级命令补全
 */
function completeTopLevel(prefix: string): CompletionResponse {
  const commands = getAllCommands();

  const items: CompletionItem[] = commands
    .filter(cmd => cmd.startsWith(prefix))
    .map(cmd => ({ label: cmd }));

  return {
    items: unique(items),
    isPartial: true
  };
}

/**
 * 子命令 / 参数补全
 */
function completeSubcommand(
  path: string[],
  prefix: string,
  prev: string
): CompletionResponse {
  const baseCommand = path[0];
  const subPath = path.slice(1);

  const candidates = getCommandSubcommands(baseCommand, subPath);

  const items: CompletionItem[] = candidates
    .filter(c => c.startsWith(prefix))
    .map(c => ({ label: c }));

  return {
    items: unique(items),
    isPartial: true
  };
}
```

> ⚠️ 注意
> - **这里不关心 shell**
> - **不关心 cur / prev**
> - 所有上下文都来自 `words + index`

---

# ✅ `utils.ts`（小工具）

```ts
// core/completion/utils.ts

import { CompletionItem } from './types';

export function unique(items: CompletionItem[]): CompletionItem[] {
  const seen = new Set<string>();
  return items.filter(i => {
    if (seen.has(i.label)) return false;
    seen.add(i.label);
    return true;
  });
}
```

---

# ✅ 你现有代码需要同步做的事（非常重要）

### ❌ 必须删除

- `currentWord`
- `previousWord`
- `_complete_subcommand`
- `_describe`
- 所有 `cur / prev / prefix` 的兼容逻辑

### ✅ CLI 只允许这样调用
🤖 AI：好，这一步我们彻底落地。
下面给你的是 core/completion 的完整终态实现示例，严格符合我们刚刚定死的协议，可以直接替换你现在的实现。

我会分 4 个文件给你：

  core/completion/
  ├── types.ts
  ├── index.ts
  ├── resolver.ts
  └── utils.ts

你可以一次性抄走，不需要再“边写边想”。

--------------------------------------------------------------------------------------------------------------------------------------

✅ types.ts（协议定义，禁止随意改）

  // core/completion/types.ts

  export interface CompletionRequest {
    /**
     * 完整 argv，不包含 node
     * e.g. ['yuangs', 'ai', 'chat', '--m']
     */
    words: string[];

    /**
     * cursor 所在 index
     */
    currentIndex: number;
  }

  export interface CompletionItem {
    label: string;
    insertText?: string;
    detail?: string;
  }

  export interface CompletionResponse {
    items: CompletionItem[];
    isPartial: boolean;
  }

--------------------------------------------------------------------------------------------------------------------------------------

✅ index.ts（唯一对外入口）

  // core/completion/index.ts

  import { CompletionRequest, CompletionResponse } from './types';
  import { resolveCompletion } from './resolver';

  export async function complete(
    req: CompletionRequest
  ): Promise<CompletionResponse> {
    // 最基础的防御
    if (!Array.isArray(req.words)) {
      return { items: [], isPartial: false };
    }

    if (
      typeof req.currentIndex !== 'number' ||
      req.currentIndex < 0 ||
      req.currentIndex >= req.words.length
    ) {
      return { items: [], isPartial: false };
    }

    return resolveCompletion(req);
  }

--------------------------------------------------------------------------------------------------------------------------------------

✅ resolver.ts（补全核心逻辑）

  这里假设你用的是 commander / program 对象
  如果你现在是 getAllCommands(program) 那种形式，也完全能接

  // core/completion/resolver.ts

  import { CompletionRequest, CompletionResponse, CompletionItem } from './types';
  import { getAllCommands, getCommandSubcommands } from './legacy'; // 你已有的函数
  import { unique } from './utils';

  export async function resolveCompletion(
    req: CompletionRequest
  ): Promise<CompletionResponse> {
    const { words, currentIndex } = req;

    const currentWord = words[currentIndex] ?? '';
    const previousWord = words[currentIndex - 1] ?? '';

    // yuangs <cursor>
    if (currentIndex === 1) {
      return completeTopLevel(currentWord);
    }

    // yuangs xxx <cursor>
    return completeSubcommand(words.slice(1, currentIndex), currentWord, previousWord);
  }

  /**
   * 顶级命令补全
   */
  function completeTopLevel(prefix: string): CompletionResponse {
    const commands = getAllCommands();

    const items: CompletionItem[] = commands
      .filter(cmd => cmd.startsWith(prefix))
      .map(cmd => ({ label: cmd }));

    return {
      items: unique(items),
      isPartial: true
    };
  }

  /**
   * 子命令 / 参数补全
   */
  function completeSubcommand(
    path: string[],
    prefix: string,
    prev: string
  ): CompletionResponse {
    const baseCommand = path[0];
    const subPath = path.slice(1);

    const candidates = getCommandSubcommands(baseCommand, subPath);

    const items: CompletionItem[] = candidates
      .filter(c => c.startsWith(prefix))
      .map(c => ({ label: c }));

    return {
      items: unique(items),
      isPartial: true
    };
  }

  ⚠️ 注意

    * **这里不关心 shell**
    * **不关心 cur / prev**
    * 所有上下文都来自 `words + index`

--------------------------------------------------------------------------------------------------------------------------------------

✅ utils.ts（小工具）

  // core/completion/utils.ts

  import { CompletionItem } from './types';

  export function unique(items: CompletionItem[]): CompletionItem[] {
    const seen = new Set<string>();
    return items.filter(i => {
      if (seen.has(i.label)) return false;
      seen.add(i.label);
      return true;
    });
  }

--------------------------------------------------------------------------------------------------------------------------------------

✅ 你现有代码需要同步做的事（非常重要）

❌ 必须删除

  * `currentWord`
  * `previousWord`
  * `_complete_subcommand`
  * `_describe`
  * 所有 `cur / prev / prefix` 的兼容逻辑

✅ CLI 只允许这样调用

  const res = await complete({ words, currentIndex });
  console.log(res.items.map(i => i.label).join(' '));

--------------------------------------------------------------------------------------------------------------------------------------

✅ 为什么这个实现是“终态”

┌───────┬─────────────────────────────┐
│ 维度  │ 状态                        │
├───────┼─────────────────────────────┤
│ 协议  │ ✅ 单一                     │
├───────┼─────────────────────────────┤
│ CLI   │ ✅ 无逻辑                   │
├───────┼─────────────────────────────┤
│ Shell │ ✅ 无分支                   │
├───────┼─────────────────────────────┤
│ 测试  │ ✅ 可纯函数                 │
├───────┼─────────────────────────────┤
│ 扩展  │ ✅ item.detail / insertText │
└───────┴─────────────────────────────┘

--------------------------------------------------------------------------------------------------------------------------------------

下一步（可选，但我强烈建议）

  1. ✅ 给 `resolveCompletion` 补 5 个单测
  2. ✅ 把 `legacy getCommandSubcommands` 逐步内聚
  3. ✅ 后面 fish / nushell **零改动接入**

如果你愿意，我可以直接下一步帮你：

  把 completion 的单测模板也一次性补齐

你只要回一句：
「继续，把单测也给我」

──────────────────── (耗时: 15.04s) ────────────────────

你：
