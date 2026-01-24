"use strict";
/**
 * AST Parser for TypeScript/JavaScript
 *
 * 使用 TypeScript Compiler API 进行真正的 AST 级别符号提取
 * 替代正则表达式，提供更准确的结构化摘要
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
exports.TypeScriptASTParser = void 0;
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * TypeScript/JavaScript AST 解析器
 */
class TypeScriptASTParser {
    /**
     * 从源代码提取符号
     */
    static parse(code, filePath) {
        try {
            const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
            const symbols = [];
            this.extractSymbols(sourceFile, symbols);
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
     * 递归遍历 AST 提取符号
     */
    static extractSymbols(node, symbols) {
        if (!node)
            return;
        const isExported = this.hasExportModifier(node);
        // 提取导入语句
        if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier.getText();
            this.addSymbol(symbols, moduleSpecifier, 'import', node);
        }
        else if (ts.isImportEqualsDeclaration(node)) {
            this.addSymbol(symbols, node.name.getText(), 'import', node);
        }
        // 提取导出语句
        else if (ts.isExportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier?.getText();
            if (moduleSpecifier) {
                this.addSymbol(symbols, `export ${moduleSpecifier}`, 'export', node);
            }
        }
        // 提取类定义
        else if (ts.isClassDeclaration(node) && node.name) {
            this.addSymbol(symbols, node.name.getText(), isExported ? 'export' : 'class', node, this.getSignature(node));
        }
        // 提取接口定义
        else if (ts.isInterfaceDeclaration(node) && node.name) {
            this.addSymbol(symbols, node.name.getText(), isExported ? 'export' : 'interface', node, this.getSignature(node));
        }
        // 提取类型别名
        else if (ts.isTypeAliasDeclaration(node) && node.name) {
            this.addSymbol(symbols, node.name.getText(), isExported ? 'export' : 'type', node, this.getSignature(node));
        }
        // 提取枚举定义
        else if (ts.isEnumDeclaration(node) && node.name) {
            this.addSymbol(symbols, node.name.getText(), isExported ? 'export' : 'enum', node, this.getSignature(node));
        }
        // 提取函数声明
        else if (ts.isFunctionDeclaration(node) && node.name) {
            this.addSymbol(symbols, node.name.getText(), isExported ? 'export' : 'function', node, this.getSignature(node));
        }
        // 提取方法声明
        else if (ts.isMethodDeclaration(node) && node.name) {
            this.addSymbol(symbols, node.name.getText(), 'function', node, this.getSignature(node));
        }
        // 提取箭头函数赋值
        else if (ts.isVariableStatement(node)) {
            const exported = this.hasExportModifier(node);
            const declaration = node.declarationList.declarations[0];
            if (declaration && ts.isIdentifier(declaration.name)) {
                const init = declaration.initializer;
                if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
                    this.addSymbol(symbols, declaration.name.getText(), exported ? 'export' : 'function', node, this.getSignature(node));
                }
                else {
                    this.addSymbol(symbols, declaration.name.getText(), exported ? 'export' : 'variable', node, this.getSignature(node));
                }
            }
        }
        // 递归处理子节点
        ts.forEachChild(node, (child) => this.extractSymbols(child, symbols));
    }
    /**
     * 检查节点是否有导出修饰符
     */
    static hasExportModifier(node) {
        if ('modifiers' in node) {
            const modifiers = node.modifiers;
            return modifiers && modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        }
        return false;
    }
    /**
     * 添加符号到列表
     */
    static addSymbol(symbols, name, type, node, signature) {
        const sourceFile = node.getSourceFile();
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        symbols.push({
            name: name.replace(/['"]/g, ''),
            type,
            line: line + 1,
            signature: signature || node.getText().split('\n')[0].slice(0, 200)
        });
    }
    /**
     * 获取节点签名字符串
     */
    static getSignature(node) {
        let signature = '';
        const nodeText = node.getText();
        // 提取第一行或签名部分
        const firstLine = nodeText.split('\n')[0];
        if (firstLine.length < 200) {
            signature = firstLine;
        }
        else {
            // 尝试提取签名部分
            const signatureMatch = firstLine.match(/^(.*?)[{;]/);
            if (signatureMatch) {
                signature = signatureMatch[1];
            }
            else {
                signature = firstLine.slice(0, 200);
            }
        }
        return signature;
    }
    /**
     * 从文件路径解析并返回符号
     */
    static async parseFile(filePath) {
        try {
            const code = await fs.readFile(filePath, 'utf-8');
            return this.parse(code, filePath);
        }
        catch (error) {
            return {
                symbols: [],
                success: false,
                error: error instanceof Error ? error.message : 'File read error'
            };
        }
    }
    /**
     * 生成紧凑的符号摘要文本
     */
    static generateCompactSummary(symbols, filePath) {
        const imports = symbols.filter(s => s.type === 'import');
        const exports = symbols.filter(s => s.type === 'export');
        const types = symbols.filter(s => ['interface', 'type', 'enum'].includes(s.type));
        const classes = symbols.filter(s => s.type === 'class');
        const functions = symbols.filter(s => s.type === 'function');
        const variables = symbols.filter(s => s.type === 'variable');
        let summary = `文件: ${path.basename(filePath)}\n`;
        summary += `统计: ${imports.length}个导入, ${exports.length}个导出, ${types.length}个类型, ${classes.length}个类, ${functions.length}个函数\n`;
        if (symbols.length > 0) {
            summary += '\n主要符号:\n';
            if (classes.length > 0) {
                summary += '  类: ' + classes.map(s => s.name).join(', ') + '\n';
            }
            if (functions.length > 0) {
                const displayFunctions = functions.slice(0, 10);
                summary += '  函数: ' + displayFunctions.map(fn => fn.name).join(', ');
                if (functions.length > 10) {
                    summary += ` (还有${functions.length - 10}个)`;
                }
                summary += '\n';
            }
            if (imports.length > 0 && imports.length <= 5) {
                summary += '  导入: ' + imports.map(s => s.name).join(', ') + '\n';
            }
            if (exports.length > 0 && exports.length <= 5) {
                summary += '  导出: ' + exports.map(s => s.name).join(', ') + '\n';
            }
        }
        return summary;
    }
}
exports.TypeScriptASTParser = TypeScriptASTParser;
//# sourceMappingURL=astParser.js.map