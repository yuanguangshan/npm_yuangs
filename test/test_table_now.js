#!/usr/bin/env node

const { StreamMarkdownRenderer } = require('./dist/utils/renderer.js');
const ora = require('ora');

const testTable = `| 姓名 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25   | 北京 |
| 李四 | 30   | 上海 |
| 王五 | 28   | 广州 |`;

console.log('\n=== 表格渲染测试 ===\n');
const spinner = ora('测试...').start();
const renderer = new StreamMarkdownRenderer('🤖 ', spinner, false);

renderer.onChunk(testTable);
renderer.finish();
