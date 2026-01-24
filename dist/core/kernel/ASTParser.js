"use strict";
/**
 * Enhanced AST Parser for X-Resolver
 *
 * 增强版 AST 解析器，支持：
 * 1. 提取导出符号（函数、类、接口、类型别名）
 * 2. 提取 JSDoc 注释和标签
 * 3. 提供符号的完整元数据（名称、类型、JSDoc、行号等）
 *
 * 使用 TypeScript Compiler API 实现精确解析
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
exports.EnhancedASTParser = void 0;
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs/promises"));
/**
 * 增强版 AST 解析器
 *
 * 为 X-Resolver 提供精确的符号提取能力
 */
class EnhancedASTParser {
    /**
     * 从文件中提取导出符号及其 JSDoc
     *
     * @param filePath - 要解析的文件路径
     * @returns 包含符号元数据的解析结果
     */
    async parseFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return this.parse(content, filePath);
        }
        catch (error) {
            return {
                symbols: [],
                success: false,
                error: error instanceof Error ? error.message : 'Failed to read file'
            };
        }
    }
    /**
     * 从代码字符串中提取导出符号及其 JSDoc
     *
     * @param code - 要解析的代码字符串
     * @param filePath - 文件路径（用于错误消息和行号计算）
     * @returns 包含符号元数据的解析结果
     */
    parse(code, filePath) {
        try {
            const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
            const symbols = [];
            this.visitAndExtractSymbols(sourceFile, symbols);
            return {
                symbols,
                success: true
            };
        }
        catch (error) {
            return {
                symbols: [],
                success: false,
                error: error instanceof Error ? error.message : 'Unknown parsing error'
            };
        }
    }
    /**
     * 递归遍历 AST 节点，提取导出符号及其 JSDoc
     *
     * @param node - AST 节点
     * @param symbols - 符号列表（输出参数）
     */
    visitAndExtractSymbols(node, symbols) {
        let isExported = false;
        // 检查节点是否有导出修饰符（仅在支持的节点类型上）
        if (ts.canHaveModifiers(node)) {
            const modifiers = ts.getModifiers(node);
            isExported = modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
        }
        // 提取符号名称和 JSDoc
        let name = '';
        let kind = '';
        if ((ts.isFunctionDeclaration(node) ||
            ts.isClassDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isEnumDeclaration(node)) && node.name) {
            name = node.name.text;
            kind = this.mapNodeKindToString(node.kind);
        }
        else if (ts.isVariableStatement(node) && isExported) {
            const declaration = node.declarationList.declarations[0];
            if (declaration && ts.isIdentifier(declaration.name)) {
                name = declaration.name.text;
                kind = 'Variable';
            }
        }
        // 如果找到了符号名称，提取其元数据
        if (name) {
            const sourceFile = node.getSourceFile();
            const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            const jsDoc = this.extractJSDoc(node);
            symbols.push({
                name,
                kind,
                jsDoc,
                startLine,
                isExported
            });
        }
        // 递归处理子节点
        ts.forEachChild(node, (child) => this.visitAndExtractSymbols(child, symbols));
    }
    /**
     * 从节点提取 JSDoc 注释
     *
     * @param node - AST 节点
     * @returns 提取的 JSDoc 文档字符串
     */
    extractJSDoc(node) {
        const jsDocNodes = node.jsDoc;
        if (!jsDocNodes || !Array.isArray(jsDocNodes) || jsDocNodes.length === 0) {
            return '';
        }
        const jsDoc = jsDocNodes[0];
        const comment = jsDoc.comment || '';
        const tags = jsDoc.tags?.map((tag) => {
            const tagName = tag.tagName?.text || '';
            const tagComment = tag.comment || '';
            const paramName = tag.name?.text || '';
            const paramText = paramName ? `${tagName} ${paramName}` : tagName;
            return tagComment ? `@${paramText} ${tagComment}` : `@${paramText}`;
        }).join('\n') || '';
        const docText = [comment, tags].filter(Boolean).join('\n').trim();
        return docText;
    }
    /**
     * 将 TypeScript 节点类型映射为可读字符串
     *
     * @param kind - TypeScript 语法种类
     * @returns 可读的符号类型字符串
     */
    mapNodeKindToString(kind) {
        switch (kind) {
            case ts.SyntaxKind.FunctionDeclaration:
                return 'Function';
            case ts.SyntaxKind.ClassDeclaration:
                return 'Class';
            case ts.SyntaxKind.InterfaceDeclaration:
                return 'Interface';
            case ts.SyntaxKind.TypeAliasDeclaration:
                return 'Type';
            case ts.SyntaxKind.EnumDeclaration:
                return 'Enum';
            case ts.SyntaxKind.VariableStatement:
                return 'Variable';
            default:
                return 'Symbol';
        }
    }
    /**
     * 获取文件中所有导出的符号名称（快捷方法）
     *
     * @param filePath - 文件路径
     * @returns 导出符号名称数组
     */
    async getExportedSymbolNames(filePath) {
        const result = await this.parseFile(filePath);
        if (!result.success) {
            return [];
        }
        return result.symbols.filter(s => s.isExported).map(s => s.name);
    }
}
exports.EnhancedASTParser = EnhancedASTParser;
//# sourceMappingURL=ASTParser.js.map