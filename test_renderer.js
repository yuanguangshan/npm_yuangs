#!/usr/bin/env node

/**
 * 测试 Terminal Native Renderer
 * 
 * 测试各种 Markdown 元素的渲染效果
 */

const { StreamMarkdownRenderer } = require('./dist/utils/renderer.js');
const chalk = require('chalk');

console.log(chalk.bold.blue('\n=== Terminal Native Renderer 测试 ===\n'));

// 测试用例
const testCases = [
  {
    name: '标题测试',
    markdown: `# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
`
  },
  {
    name: '代码块测试',
    markdown: `## Python 代码示例

\`\`\`python
def hello():
    print("Hello, World!")
    return True
\`\`\`

## 内联代码

使用 \`print()\` 函数输出内容。`
  },
  {
    name: '列表测试',
    markdown: `## 无序列表

- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3

## 有序列表

1. 第一步
2. 第二步
3. 第三步
`
  },
  {
    name: '强调测试',
    markdown: `## 文本样式

这是 **加粗文本** 和 *斜体文本*。

还可以使用 ***加粗斜体***。

内联代码：\`const x = 10;\`

[链接示例](https://example.com)
`
  },
  {
    name: '引用测试',
    markdown: `## 引用块

> 这是一段引用
> 可以有多行
> 
> 还可以包含 **加粗** 和 *斜体*

普通文本继续...`
  },
  {
    name: '混合测试',
    markdown: `# 完整示例

这是一个混合了多种 Markdown 元素的示例。

## 代码

\`\`\`javascript
const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};
\`\`\`

## 列表

- 功能 A
- 功能 B
  - 子功能 B.1
- 功能 C

## 强调

重要：**这个很重要**

提示：*这是提示*

> 引用内容

[更多信息](https://docs.example.com)
`
  }
];

// 运行测试
async function runTests() {
  for (const testCase of testCases) {
    console.log(chalk.bold.cyan(`\n--- ${testCase.name} ---\n`));
    
    const renderer = new StreamMarkdownRenderer(chalk.bold.magenta('📝 测试：'));
    
    // 模拟流式输出
    const chunks = testCase.markdown.split('\n');
    for (const chunk of chunks) {
      renderer.onChunk(chunk + '\n');
      // 小延迟模拟真实的流式输出
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    renderer.finish();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(chalk.bold.green('\n✅ 测试完成！\n'));
}

runTests().catch(console.error);
