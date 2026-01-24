"use strict";
/**
 * X-Resolver: Cross-File Symbol Dependency Resolver
 *
 * 跨文件符号依赖解析器 - yuangs 的全域感知核心
 *
 * 核心功能：
 * 1. 探测目标文件的所有导出符号（函数、类、接口、类型）
 * 2. 搜索项目中所有引用这些符号的文件
 * 3. 提取相关的代码片段和 JSDoc 文档
 * 4. 为 Agent 提供跨文件上下文感知
 */
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
exports.XResolver = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const ASTParser_1 = require("./ASTParser");
const FastScanner_1 = require("./FastScanner");
const ts = __importStar(require("typescript"));
/**
 * 跨文件符号解析器
 *
 * 为 yuangs Agent 提供跨文件依赖感知能力
 */
class XResolver {
    astParser;
    scanner;
    constructor(astParser, scanner) {
        this.astParser = astParser || new ASTParser_1.EnhancedASTParser();
        this.scanner = scanner || new FastScanner_1.FastScanner();
    }
    /**
     * 分析目标文件的跨文件影响域
     *
     * @param targetFilePath - 要分析的目标文件路径
     * @returns 跨文件影响分析结果
     */
    async getImpactAnalysis(targetFilePath) {
        const startTime = Date.now();
        const parseResult = await this.astParser.parseFile(targetFilePath);
        if (!parseResult.success) {
            return {
                targetFile: targetFilePath,
                exportedSymbols: [],
                impacts: [],
                duration: Date.now() - startTime
            };
        }
        const exportedSymbols = parseResult.symbols.filter(s => s.isExported);
        if (exportedSymbols.length === 0) {
            return {
                targetFile: targetFilePath,
                exportedSymbols: [],
                impacts: [],
                duration: Date.now() - startTime
            };
        }
        const baseName = path.basename(targetFilePath, path.extname(targetFilePath));
        const scanResult = await this.scanner.findConsumerFiles(baseName, path.dirname(targetFilePath));
        const impacts = [];
        for (const consumerFile of scanResult.consumerFiles) {
            const impact = await this.extractImpactContext(consumerFile, exportedSymbols);
            if (impact) {
                impacts.push(impact);
            }
        }
        return {
            targetFile: targetFilePath,
            exportedSymbols,
            impacts,
            duration: Date.now() - startTime
        };
    }
    /**
     * 从消费者文件中提取相关上下文
     */
    async extractImpactContext(consumerFile, exportedSymbols) {
        try {
            const content = await fs.readFile(consumerFile, 'utf-8');
            const sourceFile = ts.createSourceFile(consumerFile, content, ts.ScriptTarget.Latest, true);
            const usedSymbols = exportedSymbols.filter(sym => content.includes(sym.name));
            if (usedSymbols.length === 0) {
                return null;
            }
            const snippet = this.extractRelevantSnippet(content, sourceFile, usedSymbols);
            const jsDoc = this.getAggregatedJSDoc(usedSymbols);
            return {
                filePath: consumerFile,
                symbols: usedSymbols.map(s => s.name),
                snippet,
                jsDoc
            };
        }
        catch (error) {
            console.warn(`[X-Resolver] Failed to analyze ${consumerFile}: ${error}`);
            return null;
        }
    }
    /**
     * 提取相关代码片段（智能切片）
     */
    extractRelevantSnippet(content, sourceFile, usedSymbols) {
        const lines = content.split('\n');
        const matchedLines = new Set();
        lines.forEach((line, idx) => {
            if (usedSymbols.some(sym => line.includes(sym.name))) {
                for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 5); i++) {
                    matchedLines.add(i);
                }
            }
        });
        const sortedLines = Array.from(matchedLines).sort((a, b) => a - b);
        let snippet = '';
        for (let i = 0; i < sortedLines.length; i++) {
            const lineNum = sortedLines[i];
            const prevLine = i > 0 ? sortedLines[i - 1] : -1;
            if (lineNum > prevLine + 1) {
                snippet += '\n// ...\n';
            }
            snippet += `${lineNum + 1}: ${lines[lineNum]}\n`;
        }
        return snippet.trim();
    }
    /**
     * 聚合符号的 JSDoc
     */
    getAggregatedJSDoc(symbols) {
        const docs = symbols.filter(s => s.jsDoc).map(s => {
            return `=== ${s.name} (${s.kind}) ===\n${s.jsDoc}`;
        });
        return docs.length > 0 ? docs.join('\n\n') : '';
    }
    /**
     * 渲染为 AI 友好的上下文格式
     */
    renderAsAIContext(result) {
        let context = `\n${'='.repeat(60)}\n`;
        context += `X-RESOLVER: CROSS-FILE DEPENDENCY CONTEXT\n`;
        context += `Target: ${result.targetFile}\n`;
        context += `Exported Symbols: ${result.exportedSymbols.length}\n`;
        context += `Affected Files: ${result.impacts.length}\n`;
        context += `Analysis Time: ${result.duration}ms\n`;
        context += `${'='.repeat(60)}\n\n`;
        if (result.exportedSymbols.length > 0) {
            context += `[EXPORTED SYMBOLS]\n`;
            for (const symbol of result.exportedSymbols) {
                context += `- ${symbol.name} (${symbol.kind}) at line ${symbol.startLine}\n`;
                if (symbol.jsDoc) {
                    const shortDoc = symbol.jsDoc.split('\n')[0];
                    if (shortDoc) {
                        context += `  Doc: ${shortDoc}\n`;
                    }
                }
            }
            context += '\n';
        }
        if (result.impacts.length > 0) {
            context += `[AFFECTED FILES]\n\n`;
            for (const impact of result.impacts) {
                context += `<<< EXTERNAL DEPENDENCY REFERENCE >>>\n`;
                context += `File: ${impact.filePath}\n`;
                context += `Role: READ-ONLY (This file consumes symbols from target file)\n`;
                context += `Symbols Used: ${impact.symbols.join(', ')}\n`;
                if (impact.jsDoc) {
                    context += `\n--- SYMBOL CONTRACT (JSDoc) ---\n`;
                    context += `${impact.jsDoc}\n`;
                }
                context += `\n--- USAGE SNIPPET ---\n`;
                context += `${impact.snippet}\n`;
                context += `<<< END OF REFERENCE >>>\n\n`;
            }
        }
        return context;
    }
    /**
     * 快捷方法：仅获取导出符号
     */
    async getExportedSymbols(filePath) {
        const result = await this.astParser.parseFile(filePath);
        return result.success ? result.symbols.filter(s => s.isExported) : [];
    }
}
exports.XResolver = XResolver;
//# sourceMappingURL=XResolver.js.map