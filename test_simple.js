#!/usr/bin/env node

const { StreamMarkdownRenderer } = require('./dist/utils/renderer.js');
const ora = require('ora');

console.log('\n=== 简单测试 ===\n');

const spinner = ora('测试...').start();
const renderer = new StreamMarkdownRenderer('🤖 ', spinner, true);

// 测试 1: 简单文本
console.log('测试 1: 简单文本');
renderer.onChunk('Hello World\n');
renderer.finish();

// 测试 2: Markdown
console.log('\n测试 2: Markdown');
renderer2 = new StreamMarkdownRenderer('🤖 ', spinner, true);
renderer2.onChunk('# Hello\n\nThis is a test.\n');
renderer2.finish();

console.log('\n✅ 完成\n');
