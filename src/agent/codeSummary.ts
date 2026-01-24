import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 代码摘要生成器
 * 通过AST/Symbol级分析生成代码结构摘要，减少Token使用
 */

export interface FileSummary {
  path: string;
  summary: string;
  symbols: Symbol[];
}

export interface Symbol {
  name: string;
  type: 'function' | 'class' | 'variable' | 'import' | 'export';
  line?: number;
  signature?: string;
}

/**
 * 从代码中提取符号（简单正则实现，支持多语言）
 */
export function extractSymbols(code: string, filename: string): Symbol[] {
  const symbols: Symbol[] = [];
  const lines = code.split('\n');
  
  // 根据文件扩展名选择提取策略
  const ext = path.extname(filename).toLowerCase();
  
  if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
    extractJavaScriptSymbols(lines, symbols);
  } else if (['.py'].includes(ext)) {
    extractPythonSymbols(lines, symbols);
  } else if (['.go'].includes(ext)) {
    extractGoSymbols(lines, symbols);
  } else if (['.rs'].includes(ext)) {
    extractRustSymbols(lines, symbols);
  } else if (['.java'].includes(ext)) {
    extractJavaSymbols(lines, symbols);
  }

    }
    // Classes
    const classMatch = trimmed.match(/^class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        type: 'class',
        line: lineNum,
        signature: trimmed
      });
    }
    
    // Functions
    const funcMatch = trimmed.match(/^function\s+(\w+)/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        type: 'function',
        line: lineNum,
        signature: trimmed
      });
    }
    
    // Methods
    const methodMatch = trimmed.match(/^\s*(async\s+)?(public|private|protected)?\s*(static)?\s*(\w+)\s*\(/);
    if (methodMatch && !trimmed.includes('function ')) {
      symbols.push({
        name: methodMatch[4],
        type: 'function',
        line: lineNum,
        signature: trimmed
      });
    }
    
    // Arrow functions
    const arrowMatch = trimmed.match(/^const\s+(\w+)\s*=\s*(async\s+)?\(/);
    if (arrowMatch) {
      symbols.push({
        name: arrowMatch[1],
        type: 'function',
        line: lineNum,
        signature: trimmed
      });
    }
  });
}

/**
 * 提取Python符号
 */
function extractPythonSymbols(lines: string[], symbols: Symbol[]) {
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Imports
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      symbols.push({
        name: trimmed,
        type: 'import',
        line: lineNum
      });
    }
    
    // Classes
    const classMatch = trimmed.match(/^class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        type: 'class',
        line: lineNum,
        signature: trimmed
      });
    }
    
    // Functions
    const funcMatch = trimmed.match(/^def\s+(\w+)/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        type: 'function',
        line: lineNum,
        signature: trimmed
      });
    }
  });
}

/**
 * 提取Go符号
 */
function extractGoSymbols(lines: string[], symbols: Symbol[]) {
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Imports
    if (trimmed.startsWith('import ')) {
      symbols.push({
        name: trimmed,
        type: 'import',
        line: lineNum
      });
    }
    
    // Types/Interfaces
    const typeMatch = trimmed.match(/^(type|interface)\s+(\w+)/);
    if (typeMatch) {
      symbols.push({
        name: typeMatch[2],
        type: 'class',
        line: lineNum,
        signature: trimmed
      });
    }
    
    // Functions
    const funcMatch = trimmed.match(/^func\s+(\w+)/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        type: 'function',
        line: lineNum,
        signature: trimmed
      });
    }
  });
}

/**
 * 提取Rust符号
 */
function extractRustSymbols(lines: string[], symbols: Symbol[]) {
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Uses
    if (trimmed.startsWith('use ')) {
      symbols.push({
        name: trimmed,
        type: 'import',
        line: lineNum
      });
    }
    
    // Structs
    const structMatch = trimmed.match(/^struct\s+(\w+)/);
    if (structMatch) {
      symbols.push({
        name: structMatch[1],
        type: 'class',
        line: lineNum,
        signature: trimmed
      });
    }
    
    // Functions
    const funcMatch = trimmed.match(/^fn\s+(\w+)/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        type: 'function',
        line: lineNum,
        signature: trimmed
      });
    }
  });
}

/**
 * 提取Java符号
 */
function extractJavaSymbols(lines: string[], symbols: Symbol[]) {
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Imports
    if (trimmed.startsWith('import ')) {
      symbols.push({
        name: trimmed,
        type: 'import',
        line: lineNum
      });
    }
    
    // Classes
    const classMatch = trimmed.match(/^class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        type: 'class',
        line: lineNum,
        signature: trimmed
      });
    }
    
    // Methods
    const methodMatch = trimmed.match(/^\s*(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\(/);
    if (methodMatch) {
      symbols.push({
        name: methodMatch[2],
        type: 'function',
        line: lineNum,
        signature: trimmed
      });
    }
  });
}

/**
 * 生成文件摘要
 */
export function generateFileSummary(filePath: string, content: string): FileSummary {
  const symbols = extractSymbols(content, filePath);
  
  // 统计符号类型
  const stats = {
    imports: symbols.filter(s => s.type === 'import').length,
    exports: symbols.filter(s => s.type === 'export').length,
    classes: symbols.filter(s => s.type === 'class').length,
    functions: symbols.filter(s => s.type === 'function').length,
  };
  
  // 生成摘要文本
  let summary = `文件: ${path.basename(filePath)}\n`;
  summary += `统计: ${stats.imports}个导入, ${stats.exports}个导出, ${stats.classes}个类, ${stats.functions}个函数\n`;
  
  if (symbols.length > 0) {
    summary += '\n主要符号:\n';
    
    // 按类型分组
    const classes = symbols.filter(s => s.type === 'class');
    const functions = symbols.filter(s => s.type === 'function');
    const imports = symbols.filter(s => s.type === 'import');
    const exports = symbols.filter(s => s.type === 'export');
    
    if (classes.length > 0) {
      summary += '  类: ' + classes.map(s => s.name).join(', ') + '\n';
    }
    
    if (functions.length > 0) {
      summary += '  函数: ' + functions.slice(0, 10).map(s => s.name).join(', ');
      if (functions.length > 10) {
        summary += ` (还有${functions.length - 10}个)`;
      }
      summary += '\n';
    }
    
    if (imports.length > 0 && imports.length <= 5) {
      summary += '  导入: ' + imports.map(s => s.name).join(', ') + '\n';
    }
  }
  
  return {
    path: filePath,
    summary,
    symbols
  };
}

/**
 * 生成多文件摘要
 */
export async function generateMultipleFileSummaries(files: Array<{ path: string; content: string }>): Promise<FileSummary[]> {
  const summaries: FileSummary[] = [];
  
  for (const file of files) {
    const summary = generateFileSummary(file.path, file.content);
    summaries.push(summary);
  }
  
  return summaries;
}

/**
 * 生成摘要报告（用于注入到Prompt）
 */
export function generateSummaryReport(summaries: FileSummary[], maxLength: number = 2000): string {
  let report = '[CODE STRUCTURE SUMMARY]\n';
  
  for (const summary of summaries) {
    // 如果超过最大长度，截断
    if (report.length + summary.summary.length > maxLength) {
      const remaining = maxLength - report.length - 20;
      if (remaining > 0) {
        report += `\n... (还有${summaries.length - summaries.indexOf(summary)}个文件未显示，可按需查看详情)`;
      }
      break;
    }
    
    report += '\n' + summary.summary;
  }
  
  return report;
}
