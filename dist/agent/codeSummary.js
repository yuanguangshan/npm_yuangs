"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSymbols = extractSymbols;
exports.generateFileSummary = generateFileSummary;
exports.generateMultipleFileSummaries = generateMultipleFileSummaries;
exports.generateSummaryReport = generateSummaryReport;
const path = __importStar(require("path"));
const astParser_1 = require("./astParser");
/**
 * 从代码中提取符号（优先AST，回退到正则）
 */
function extractSymbols(code, filename) {
    const ext = path.extname(filename).toLowerCase();
    // TypeScript/JavaScript 优先使用 AST 解析
    if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
        const result = astParser_1.TypeScriptASTParser.parse(code, filename);
        if (result.success) {
            return result.symbols;
        }
        // AST 解析失败，回退到正则表达式
        console.warn(`[codeSummary] AST parsing failed for ${filename}, falling back to regex: ${result.error}`);
    }
    // 其他语言使用正则表达式（向后兼容）
    const symbols = [];
    const lines = code.split('\n');
    if (['.py'].includes(ext)) {
        extractPythonSymbols(lines, symbols);
    }
    else if (['.go'].includes(ext)) {
        extractGoSymbols(lines, symbols);
    }
    else if (['.rs'].includes(ext)) {
        extractRustSymbols(lines, symbols);
    }
    else if (['.java'].includes(ext)) {
        extractJavaSymbols(lines, symbols);
    }
    else if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
        // TS/JS 正则回退
        extractJavaScriptSymbols(lines, symbols);
    }
    return symbols;
}
function extractJavaScriptSymbols(lines, symbols) {
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
            symbols.push({
                name: trimmed,
                type: trimmed.startsWith('import ') ? 'import' : 'export',
                line: lineNum
            });
        }
        const classMatch = trimmed.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
        const funcMatch = trimmed.match(/^function\s+(\w+)/);
        if (funcMatch) {
            symbols.push({
                name: funcMatch[1],
                type: 'function',
                line: lineNum,
                signature: trimmed
            });
        }
        const methodMatch = trimmed.match(/^\s*(async\s+)?(public|private|protected)?\s*(static)?\s*(\w+)\s*\(/);
        if (methodMatch && !trimmed.includes('function ')) {
            symbols.push({
                name: methodMatch[4],
                type: 'function',
                line: lineNum,
                signature: trimmed
            });
        }
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
function extractPythonSymbols(lines, symbols) {
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            symbols.push({
                name: trimmed,
                type: 'import',
                line: lineNum
            });
        }
        const classMatch = trimmed.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
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
function extractGoSymbols(lines, symbols) {
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        if (trimmed.startsWith('import ')) {
            symbols.push({
                name: trimmed,
                type: 'import',
                line: lineNum
            });
        }
        const typeMatch = trimmed.match(/^(type|interface)\s+(\w+)/);
        if (typeMatch) {
            symbols.push({
                name: typeMatch[2],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
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
function extractRustSymbols(lines, symbols) {
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        if (trimmed.startsWith('use ')) {
            symbols.push({
                name: trimmed,
                type: 'import',
                line: lineNum
            });
        }
        const structMatch = trimmed.match(/^struct\s+(\w+)/);
        if (structMatch) {
            symbols.push({
                name: structMatch[1],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
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
function extractJavaSymbols(lines, symbols) {
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        if (trimmed.startsWith('import ')) {
            symbols.push({
                name: trimmed,
                type: 'import',
                line: lineNum
            });
        }
        const classMatch = trimmed.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
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
function generateFileSummary(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();
    // TypeScript/JavaScript 优先使用 AST 紧凑摘要
    if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
        const result = astParser_1.TypeScriptASTParser.parse(content, filePath);
        if (result.success) {
            return {
                path: filePath,
                summary: astParser_1.TypeScriptASTParser.generateCompactSummary(result.symbols, filePath),
                symbols: result.symbols
            };
        }
    }
    // 回退到正则表达式摘要
    const symbols = extractSymbols(content, filePath);
    const stats = {
        imports: symbols.filter(s => s.type === 'import').length,
        exports: symbols.filter(s => s.type === 'export').length,
        classes: symbols.filter(s => s.type === 'class').length,
        functions: symbols.filter(s => s.type === 'function').length,
    };
    let summary = `文件: ${path.basename(filePath)}\n`;
    summary += `统计: ${stats.imports}个导入, ${stats.exports}个导出, ${stats.classes}个类, ${stats.functions}个函数\n`;
    if (symbols.length > 0) {
        summary += '\n主要符号:\n';
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
async function generateMultipleFileSummaries(files) {
    const summaries = [];
    for (const file of files) {
        const summary = generateFileSummary(file.path, file.content);
        summaries.push(summary);
    }
    return summaries;
}
/**
 * 生成摘要报告（用于注入到Prompt）
 */
function generateSummaryReport(summaries, maxLength = 2000) {
    let report = '[CODE STRUCTURE SUMMARY]\n';
    for (const summary of summaries) {
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
//# sourceMappingURL=codeSummary.js.map