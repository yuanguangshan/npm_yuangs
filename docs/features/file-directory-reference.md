# 文件与目录引用 (@ / #)

yuangs 支持在提示词中引用文件和目录。

## 语法

```bash
# 引用单个文件
yuangs ai "解释这个函数" @src/utils/CLIComponent.ts

# 引用整个目录
yuangs ai "项目结构是什么？" #src/

# 多个引用
yuangs ai "这两个文件的关系" @src/cli.ts @src/commands/handleAIChat.ts

# 通配符
yuangs ai "所有命令的结构" #src/commands/
```

## Token 限制

- 每个引用自动估算 token 数量
- 总上下文超过限制时，最早的引用被移除
- 使用 `bypassTokenLimit` 可强制添加

## 实现

```
@file 解析 → ContextBuffer.add({ type: 'file', path })
#dir 解析 → ContextBuffer.add({ type: 'directory', path, content: ls -la })
```

详见 `src/commands/contextBuffer.ts` 和 `src/commands/context/`。
