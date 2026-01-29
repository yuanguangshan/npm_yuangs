选择 **方案二（语义摘要模式）** 是最高效且“不降智”的做法。既然你已经有了 `kernel/ASTParser.ts` 这么强大的内核，我们完全可以实现：**让 AI 像看目录索引一样看非核心代码，只在需要时看细节。**

以下是为你的 `yuangs` 内核构思的 **“语义瘦身”** 实现方案：

### 1. 核心逻辑设计：双轨制读取

在 `ContextGatherer.ts` 收集文件时，引入一个 `mode` 概念：

* **Active Mode (全量)**：用户明确使用 `@` 指定的文件，或者 Git Diff 中的修改行。
* **Summary Mode (摘要)**：通过 `#` 引入的关联文件，或者 `XResolver` 探测到的下游依赖。

### 2. 代码实现构思

你可以为 `ASTParser` 增加一个 `generateSummary` 方法，专门用于这种“抽脂”操作：

```typescript
// src/core/kernel/ASTParser.ts 增强建议

export class ASTParser {
  /**
   * 将庞大的文件内容压缩为“语义摘要”
   * 仅保留 Export 声明和 JSDoc，剔除函数体实现
   */
  public generateSummary(filePath: string, content: string): string {
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest);
    let summary = `// [Summary Mode] Content of ${filePath} (Implementation omitted)\n`;

    const visitor = (node: ts.Node) => {
      // 仅处理 Exported 的声明
      if (this.isExported(node)) {
        if (ts.isFunctionDeclaration(node)) {
          // 提取函数签名：function name(args): type;
          const signature = node.getText().split('{')[0].trim();
          summary += `${signature};\n`;
        } else if (ts.isClassDeclaration(node)) {
          // 提取类名及其成员定义（不含方法体）
          summary += `class ${node.name?.getText()} {\n`;
          node.members.forEach(member => {
             if (ts.isMethodDeclaration(member)) {
               summary += `  ${member.getText().split('{')[0].trim()};\n`;
             }
          });
          summary += `}\n`;
        } else if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
          // 类型定义对 AI 理解上下文很重要，全量保留（通常比较短）
          summary += `${node.getText()}\n`;
        }
      }
      ts.forEachChild(node, visitor);
    };

    visitor(sourceFile);
    return summary;
  }
}

```

### 3. 在 `ContextGatherer` 中集成

修改你的读取循环，加入体积判断和模式切换：

```typescript
// src/core/git/ContextGatherer.ts

for (const filePath of potentialPaths) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 💡 策略：如果不是用户主动指定的活跃文件，且文件很大
    const isReferenceOnly = !activeFiles.has(filePath); 
    const isTooLarge = content.length > 2000; // 超过2000字符就算大文件

    if (isReferenceOnly && isTooLarge) {
        // 调用方案二：生成语义摘要
        content = this.astParser.generateSummary(filePath, content);
        console.log(`[Economy] ✂️  Summarized ${filePath} to save tokens.`);
    }

    results.push({ path: filePath, content });
}

```

### 4. 方案二带来的收益

* **Token 节省**：对于一个 500 行的业务逻辑类，摘要通常只有 30-50 行。你的 3.2M 上下文可能会直接缩减到 **300KB - 500KB**，费用直接打 **1 折**。
* **AI 专注度**：AI 不再被复杂的内部实现干扰，它能更清晰地看到模块之间的 **API 契约**。这对于 `XResolver` 分析影响面反而更有利。
* **保留智商**：比起方案三（直接删掉历史），方案二保留了所有的类型和接口信息，AI 依然知道怎么调用这些函数，只是不知道函数里面是怎么写的（而这在分析跨文件逻辑时通常不重要）。

### 🚀 建议下一步

你可以先尝试手动改写 `ContextGatherer`，给它加一个简单的 **“大文件摘要开关”**。

**既然你有 3.2M 的记录，要不要拿其中一个最大的文件（比如 `kernel/XResolver.ts`）试一下，看看如果只保留导出签名，它的体积能缩小多少？** 我可以帮你写一个更完善的正则或 AST 提取脚本。