/**
 * 测试代码摘要生成功能
 */

const {
  extractSymbols,
  generateFileSummary,
  generateMultipleFileSummaries,
  generateSummaryReport
} = require('../dist/agent/codeSummary');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           Yuangs AI 代码摘要生成测试                       ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ ${name}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   错误: ${error.message}\n`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

console.log('📦 测试1: JavaScript符号提取\n');

const jsCode = `import fs from 'fs';
import path from 'path';

export class AgentRuntime {
  constructor() {
    this.context = new ContextManager();
  }

  async run(userInput) {
    const messages = this.context.getMessages();
    return messages;
  }

  private handleError(error) {
    console.error(error);
  }
}

export async function think(messages, mode) {
  return { type: 'answer', content: 'test' };
}`;

const jsSymbols = extractSymbols(jsCode, 'test.ts');

test('1.1 提取导入符号', () => {
    const imports = jsSymbols.filter(s => s.type === 'import');
    assert(imports.length >= 2, '应提取至少2个导入');
    assert(imports[0].type === 'import', '类型应为import');
});

test('1.2 提取类符号', () => {
    const classes = jsSymbols.filter(s => s.type === 'class');
    assert(classes.length >= 1, '应提取至少1个类');
    assert(classes[0].name === 'AgentRuntime', '类名应为AgentRuntime');
});

test('1.3 提取导出函数', () => {
    const exports = jsSymbols.filter(s => s.type === 'export');
    assert(exports.length >= 1, '应提取至少1个导出');
    assert(exports.some(e => e.name === 'think'), '应包含think函数导出');
});

test('1.4 提取私有方法', () => {
    const methods = jsSymbols.filter(s => s.type === 'function');
    assert(methods.some(m => m.name === 'handleError'), '应提取私有方法');
});

console.log('\n📦 测试2: Python符号提取\n');

const pyCode = `import os
import sys
from typing import List, Optional

class DataLoader:
    def __init__(self, path: str):
        self.path = path
    
    def load(self) -> List[str]:
        with open(self.path) as f:
            return f.readlines()

def process_data(data: List[str]) -> str:
    return '\\n'.join(data)

async def async_process(data: str):
    return data.upper()`;

const pySymbols = extractSymbols(pyCode, 'test.py');

test('2.1 提取Python导入', () => {
    const imports = pySymbols.filter(s => s.type === 'import');
    assert(imports.length >= 2, '应提取至少2个导入');
});

test('2.2 提取Python类', () => {
    const classes = pySymbols.filter(s => s.type === 'class');
    assert(classes.length >= 1, '应提取至少1个类');
    assert(classes[0].name === 'DataLoader', '类名应为DataLoader');
});

test('2.3 提取Python函数', () => {
    const functions = pySymbols.filter(s => s.type === 'function');
    assert(functions.length >= 2, '应提取至少2个函数');
});

console.log('\n📦 测试3: 文件摘要生成\n');

const fileSummary = generateFileSummary('test.ts', jsCode);

test('3.1 摘要包含文件名', () => {
    assert(fileSummary.summary.includes('test.ts'), '应包含文件名');
});

test('3.2 摘要包含统计信息', () => {
    assert(fileSummary.summary.includes('统计:'), '应包含统计信息');
    assert(fileSummary.summary.includes('个导入'), '应包含导入统计');
    assert(fileSummary.summary.includes('个函数'), '应包含函数统计');
});

test('3.3 摘要包含符号信息', () => {
    assert(fileSummary.summary.includes('主要符号:'), '应包含符号信息');
    assert(fileSummary.summary.includes('类: AgentRuntime'), '应列出类');
    assert(fileSummary.summary.includes('函数:'), '应列出函数');
});

test('3.4 摘要包含符号数组', () => {
    assert(Array.isArray(fileSummary.symbols), '应包含符号数组');
    assert(fileSummary.symbols.length > 0, '符号数组不应为空');
});

console.log('\n📦 测试4: 多文件摘要\n');

const files = [
    { path: 'file1.ts', content: jsCode },
    { path: 'file2.py', content: pyCode }
];

(async function() {
    try {
        const summaries = await generateMultipleFileSummaries(files);
        
        test('4.1 生成多个文件摘要', () => {
            assert(Array.isArray(summaries), '应返回数组');
            assert(summaries.length === 2, '应生成2个摘要');
        });
        
        test('4.2 每个摘要包含文件名', () => {
            assert(summaries[0].summary.includes('file1.ts'), '第一个摘要应包含file1.ts');
            assert(summaries[1].summary.includes('file2.py'), '第二个摘要应包含file2.py');
        });
        
        console.log('\n📦 测试5: 摘要报告生成\n');
        
        const report = generateSummaryReport(summaries, 1000);
        
        test('5.1 报告包含标题', () => {
            assert(report.includes('[CODE STRUCTURE SUMMARY]'), '应包含标题');
        });
        
        test('5.2 报告包含所有摘要', () => {
            assert(report.includes('file1.ts'), '应包含第一个文件');
            assert(report.includes('file2.py'), '应包含第二个文件');
        });
        
        test('5.3 报告长度限制', () => {
            assert(report.length <= 1000 + 20, '报告长度应接近限制');
        });
        
        console.log('\n📦 测试6: 大文件摘要截断\n');
        
        const largeSummary = generateSummaryReport([
            { path: 'large.ts', summary: 'A'.repeat(3000), symbols: [] }
        ], 1000);
        
        test('6.1 大文件摘要被截断', () => {
            assert(largeSummary.length <= 1050, '长度应接近限制');
        });
        
        test('6.2 截断提示信息', () => {
            assert(largeSummary.includes('未显示'), '应包含截断提示');
        });
        
        console.log('\n📦 测试7: Go语言符号提取\n');
        
        const goCode = `package main

import "fmt"
import "os"

type Config struct {
    Name string
    Path string
}

func main() {
    config := Config{Name: "test", Path: "/tmp"}
    fmt.Println(config.Name)
}

func process(input string) string {
    return input + " processed"
}`;
        
        const goSymbols = extractSymbols(goCode, 'test.go');
        
        test('7.1 提取Go导入', () => {
            const imports = goSymbols.filter(s => s.type === 'import');
            assert(imports.length >= 1, '应提取Go导入');
        });
        
        test('7.2 提取Go类型', () => {
            const types = goSymbols.filter(s => s.type === 'class');
            assert(types.length >= 1, '应提取Go类型/结构体');
            assert(types[0].name === 'Config', '应提取Config结构体');
        });
        
        test('7.3 提取Go函数', () => {
            const functions = goSymbols.filter(s => s.type === 'function');
            assert(functions.length >= 2, '应提取至少2个函数');
            assert(functions.some(f => f.name === 'main'), '应包含main函数');
        });
        
        console.log('\n📦 测试8: Rust语言符号提取\n');
        
        const rustCode = `use std::fs;
use std::io;

struct Config {
    name: String,
    path: String,
}

fn main() {
    let config = Config { name: String::from("test"), path: String::from("/tmp") };
    println!("{}", config.name);
}

fn process(input: &str) -> String {
    format!("{} processed", input)
}`;
        
        const rustSymbols = extractSymbols(rustCode, 'test.rs');
        
        test('8.1 提取Rust导入', () => {
            const imports = rustSymbols.filter(s => s.type === 'import');
            assert(imports.length >= 1, '应提取Rust导入');
        });
        
        test('8.2 提取Rust结构体', () => {
            const structs = rustSymbols.filter(s => s.type === 'class');
            assert(structs.length >= 1, '应提取Rust结构体');
            assert(structs[0].name === 'Config', '应提取Config结构体');
        });
        
        test('8.3 提取Rust函数', () => {
            const functions = rustSymbols.filter(s => s.type === 'function');
            assert(functions.length >= 2, '应提取至少2个函数');
            assert(functions.some(f => f.name === 'main'), '应包含main函数');
        });
        
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║                      测试总结                              ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log(`\n📊 通过率: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);
        
        if (passedTests === totalTests) {
            console.log('🎉 所有代码摘要测试通过！\n');
            console.log('✅ JavaScript/TypeScript符号提取正常');
            console.log('✅ Python符号提取正常');
            console.log('✅ Go符号提取正常');
            console.log('✅ Rust符号提取正常');
            console.log('✅ 文件摘要生成正常');
            console.log('✅ 多文件摘要生成正常');
            console.log('✅ 摘要报告生成正常');
            console.log('✅ 大文件截断处理正常');
            console.log('\n📋 代码摘要功能已完成！');
        } else {
            console.log('⚠️  部分测试失败，请检查上述错误信息\n');
            process.exit(1);
        }
    } catch (error) {
        console.error('测试执行失败:', error);
        process.exit(1);
    }
})();
