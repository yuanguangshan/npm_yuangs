/**
 * Enhanced AST Parser for Auditable Execution Kernel
 *
 * 增强版 AST 解析器，作为内核的 "事实提取器"，支持：
 * 1. 提取导出符号（函数、类、接口、类型别名、变量等）
 * 2. 提取 JSDoc 注释和标签
 * 3. 提供符号的完整元数据（名称、类型、JSDoc、行号、符号哈希等）
 * 4. 支持嵌套结构（类中的方法、函数中的函数等）
 * 5. 处理匿名函数和箭头函数
 * 6. 生成符号哈希用于审计验证
 * 7. 集成 TypeChecker 以支持跨文件类型解析
 *
 * 使用 TypeScript Compiler API 实现精确解析
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

/**
 * 符号元数据接口
 */
export interface SymbolMetadata {
  /** 符号名称 */
  name: string;
  /** 符号类型 */
  kind: string;
  /** JSDoc 注释内容 */
  jsDoc: string;
  /** 起始行号（从1开始） */
  startLine: number;
  /** 结束行号（从1开始） */
  endLine: number;
  /** 是否已导出 */
  isExported: boolean;
  /** 符号内容的哈希值（用于审计验证） */
  hash: string;
  /** 符号的完整源码内容 */
  content: string;
  /** 访问修饰符（public, private, protected） */
  accessibility?: 'public' | 'private' | 'protected';
  /** 参数列表（如果是函数/方法） */
  parameters?: ParameterInfo[];
  /** 返回类型（如果是函数） */
  returnType?: string;
  /** 泛型参数（如果有） */
  typeParameters?: string[];
  /** 父级符号名称（用于嵌套结构） */
  parentName?: string;
  /** 是否是匿名函数 */
  isAnonymous?: boolean;
  /** 符号的完整路径（如：ClassName.methodName） */
  fullPath?: string;
}

/**
 * 参数信息接口
 */
export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
}

/**
 * AST 解析结果
 */
export interface ASTParseResult {
  /** 提取的符号列表 */
  symbols: SymbolMetadata[];
  /** 解析是否成功 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 增强版 AST 解析器
 *
 * 作为可审计执行内核的 "事实提取器"，提供精确的符号提取能力
 */
export class EnhancedASTParser {

  /**
   * 从文件中提取导出符号及其 JSDoc
   *
   * @param filePath - 要解析的文件路径
   * @returns 包含符号元数据的解析结果
   */
  async parseFile(filePath: string): Promise<ASTParseResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parse(content, filePath);
    } catch (error) {
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
  parse(code: string, filePath: string): ASTParseResult {
    try {
      // 创建虚拟源文件用于解析代码字符串
      const sourceFile = ts.createSourceFile(
        filePath,
        code,
        ts.ScriptTarget.Latest,
        true
      );

      // 创建一个最小化的程序来获取 TypeChecker
      // We'll create a program with the source file in memory
      const host = ts.createCompilerHost({});
      const originalGetSourceFile = host.getSourceFile;

      // Override getSourceFile to return our in-memory source file
      host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
        if (fileName === filePath) {
          return sourceFile;
        }
        return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
      };

      // Create program with the custom host
      const program = ts.createProgram([filePath], {}, host);
      const typeChecker = program.getTypeChecker(); // Local variable to avoid state issues

      const symbols: SymbolMetadata[] = [];
      this.visitAndExtractSymbols(sourceFile, symbols, [], typeChecker);

      return {
        symbols,
        success: true
      };
    } catch (error) {
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
   * @param parentStack - 父级符号栈（用于嵌套结构）
   * @param typeChecker - TypeScript 类型检查器
   */
  private visitAndExtractSymbols(node: ts.Node, symbols: SymbolMetadata[], parentStack: string[], typeChecker: ts.TypeChecker): void {
    // Extract modifier information
    const { isExported, accessibility } = this.extractModifiers(node);

    // Extract symbol information
    const symbolInfo = this.extractSymbolInfo(node, parentStack, typeChecker);

    // If we found a symbol, add its metadata
    if (symbolInfo.name) {
      const sourceFile = node.getSourceFile();
      const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
      const jsDoc = this.extractJSDoc(node);
      const content = node.getText();
      const hash = this.calculateHash(content);

      // Build full path
      const fullPath = parentStack.length > 0 ? [...parentStack, symbolInfo.name].join('.') : symbolInfo.name;

      symbols.push({
        name: symbolInfo.name,
        kind: symbolInfo.kind,
        jsDoc,
        startLine,
        endLine,
        isExported,
        hash,
        content,
        accessibility,
        parameters: symbolInfo.parameters,
        returnType: symbolInfo.returnType,
        typeParameters: symbolInfo.typeParameters,
        parentName: parentStack[parentStack.length - 1],
        isAnonymous: symbolInfo.isAnonymous,
        fullPath
      });
    }

    // Update parent stack
    const newParentStack = [...parentStack];
    if (symbolInfo.name && this.shouldPushToParentStack(symbolInfo.kind)) {
      newParentStack.push(symbolInfo.name);
    }

    // Recursively process child nodes
    ts.forEachChild(node, (child) => this.visitAndExtractSymbols(child, symbols, newParentStack, typeChecker));
  }

  /**
   * Extract modifier information (export, access modifiers) from a node
   */
  private extractModifiers(node: ts.Node): { isExported: boolean, accessibility: 'public' | 'private' | 'protected' | undefined } {
    let isExported = false;
    let accessibility: 'public' | 'private' | 'protected' | undefined = undefined;

    // Check if node can have modifiers
    if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers) {
        isExported = modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);

        // Check for access modifiers
        const accessibilityModifier = modifiers.find(m =>
          m.kind === ts.SyntaxKind.PublicKeyword ||
          m.kind === ts.SyntaxKind.PrivateKeyword ||
          m.kind === ts.SyntaxKind.ProtectedKeyword
        );
        if (accessibilityModifier) {
          accessibility = ts.tokenToString(accessibilityModifier.kind) as 'public' | 'private' | 'protected';
        }
      }
    }

    return { isExported, accessibility };
  }

  /**
   * Extract symbol information from a node
   */
  private extractSymbolInfo(node: ts.Node, parentStack: string[], typeChecker: ts.TypeChecker): {
    name: string;
    kind: string;
    parameters: ParameterInfo[];
    returnType: string;
    typeParameters: string[];
    isAnonymous: boolean;
  } {
    let name = '';
    let kind = '';
    let parameters: ParameterInfo[] = [];
    let returnType = '';
    let typeParameters: string[] = [];
    let isAnonymous = false;

    // Handle different node types
    if (ts.isFunctionDeclaration(node) && node.name) {
      name = node.name.text;
      kind = 'Function';
      parameters = this.extractParameters(node.parameters, typeChecker);
      if (node.type) {
        returnType = this.extractType(node.type, typeChecker);
      }
      if (node.typeParameters) {
        typeParameters = node.typeParameters.map(tp => tp.name.text);
      }
    } else if (ts.isMethodDeclaration(node)) {
      name = node.name.getText();
      kind = 'Method';
      parameters = this.extractParameters(node.parameters, typeChecker);
      if (node.type) {
        returnType = this.extractType(node.type, typeChecker);
      }
      if (node.typeParameters) {
        typeParameters = node.typeParameters.map(tp => tp.name.text);
      }
    } else if (ts.isArrowFunction(node)) {
      // Handle arrow functions - give them a virtual name
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        name = parent.name.text;
        kind = 'ArrowFunction';
        // Consider arrow functions assigned to variables as named, not anonymous
        isAnonymous = false;
      } else if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        name = parent.name.text;
        kind = 'ArrowFunction';
        isAnonymous = false;
      } else {
        name = `anonymous_arrow_${this.generateAnonymousName(node)}`;
        kind = 'ArrowFunction';
        isAnonymous = true;
      }
      parameters = this.extractParameters(node.parameters, typeChecker);
      if (node.type) {
        returnType = this.extractType(node.type, typeChecker);
      }
    } else if (ts.isFunctionExpression(node)) {
      // Handle function expressions - give them a virtual name
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        name = parent.name.text;
        kind = 'FunctionExpression';
        // Consider function expressions assigned to variables as named, not anonymous
        isAnonymous = false;
      } else if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        name = parent.name.text;
        kind = 'FunctionExpression';
        isAnonymous = false;
      } else {
        name = `anonymous_func_${this.generateAnonymousName(node)}`;
        kind = 'FunctionExpression';
        isAnonymous = true;
      }
      parameters = this.extractParameters(node.parameters, typeChecker);
      if (node.type) {
        returnType = this.extractType(node.type, typeChecker);
      }
    } else if (ts.isClassDeclaration(node) && node.name) {
      name = node.name.text;
      kind = 'Class';
    } else if (ts.isInterfaceDeclaration(node) && node.name) {
      name = node.name.text;
      kind = 'Interface';
    } else if (ts.isTypeAliasDeclaration(node) && node.name) {
      name = node.name.text;
      kind = 'Type';
    } else if (ts.isEnumDeclaration(node) && node.name) {
      name = node.name.text;
      kind = 'Enum';
    } else if (ts.isVariableStatement(node)) {
      // Extract variable declarations
      const declaration = node.declarationList.declarations[0];
      if (declaration && ts.isIdentifier(declaration.name)) {
        name = declaration.name.text;
        kind = 'Variable';
      }
    } else if (ts.isVariableDeclaration(node) && !ts.isVariableStatement(node.parent)) {
      // Handle non-top-level variable declarations
      if (ts.isIdentifier(node.name)) {
        name = node.name.text;
        kind = 'Variable';
      }
    }

    return { name, kind, parameters, returnType, typeParameters, isAnonymous };
  }

  /**
   * 判断是否应将符号推入父级栈
   */
  private shouldPushToParentStack(kind: string): boolean {
    return ['Class', 'Interface', 'Function', 'Method'].includes(kind);
  }

  /**
   * 生成匿名函数的唯一名称
   */
  private generateAnonymousName(node: ts.Node): string {
    const start = node.getStart();
    const length = node.getEnd() - start;
    return `anon_${start}_${length}`;
  }

  /**
   * 提取函数参数信息
   */
  private extractParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>, typeChecker: ts.TypeChecker): ParameterInfo[] {
    return parameters.map(param => ({
      name: param.name.getText(),
      type: param.type ? this.extractType(param.type, typeChecker) : 'any',
      optional: !!param.questionToken
    }));
  }

  /**
   * 提取类型信息
   */
  private extractType(typeNode: ts.TypeNode, typeChecker: ts.TypeChecker): string {
    try {
      // 尝试使用 TypeChecker 获取更准确的类型信息
      const type = typeChecker.getTypeAtLocation(typeNode);
      return typeChecker.typeToString(type);
    } catch {
      // 如果 TypeChecker 失败，则回退到文本提取
      return typeNode.getText();
    }
  }

  /**
   * 从节点提取 JSDoc 注释
   *
   * @param node - AST 节点
   * @returns 提取的 JSDoc 文档字符串
   */
  private extractJSDoc(node: ts.Node): string {
    const jsDocNodes = ts.getJSDocCommentsAndTags(node);

    if (!jsDocNodes || jsDocNodes.length === 0) {
      return '';
    }

    // Collect all JSDoc content, prioritizing the closest one to the node
    const jsDocContents: string[] = [];

    for (const jsDocNode of jsDocNodes) {
      if (ts.isJSDoc(jsDocNode)) {
        // Extract the main comment text
        let commentText = '';
        if (typeof jsDocNode.comment === 'string') {
          commentText = jsDocNode.comment || '';
        } else if (jsDocNode.comment && Array.isArray(jsDocNode.comment)) {
          // Handle array of text nodes
          commentText = jsDocNode.comment.map(c => c.text).join(' ');
        }

        // Process tags if present
        const tags = jsDocNode.tags?.map(tag => {
          const tagName = tag.tagName.text;
          let tagComment = '';
          if (typeof tag.comment === 'string') {
            tagComment = tag.comment || '';
          } else if (tag.comment && Array.isArray(tag.comment)) {
            tagComment = tag.comment.map(c => c.text).join(' ');
          }
          return tagComment ? `@${tagName} ${tagComment}` : `@${tagName}`;
        }).join('\n') || '';

        const combined = [commentText, tags].filter(Boolean).join('\n').trim();
        if (combined) {
          jsDocContents.push(combined);
        }
      }
    }

    // Return the combined content, with priority to the most recent JSDoc
    return jsDocContents.join('\n\n').trim();
  }

  /**
   * 计算内容的哈希值（用于审计验证）
   */
  private calculateHash(content: string): string {
    // 移除空格和注释以确保只有逻辑变化影响哈希
    const normalizedContent = this.normalizeCode(content);
    return crypto.createHash('sha256').update(normalizedContent).digest('hex');
  }

  /**
   * 规范化代码（移除空格和注释） using AST-based approach to avoid issues with string literals
   */
  private normalizeCode(code: string): string {
    // Parse the code to create an AST
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );

    // Use TypeScript's printer to recreate the source without comments
    const printer = ts.createPrinter({ removeComments: true });
    const result = printer.printFile(sourceFile);

    // Further normalize whitespace
    return result.replace(/\s+/g, ' ').trim();
  }

  /**
   * 将 TypeScript 节点类型映射为可读字符串
   *
   * @param kind - TypeScript 语法种类
   * @returns 可读的符号类型字符串
   */
  private mapNodeKindToString(kind: ts.SyntaxKind): string {
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
  async getExportedSymbolNames(filePath: string): Promise<string[]> {
    const result = await this.parseFile(filePath);
    if (!result.success) {
      return [];
    }
    return result.symbols.filter(s => s.isExported).map(s => s.name);
  }

  /**
   * 比较两个解析结果，找出差异（用于审计目的）
   */
  compareResults(oldResult: ASTParseResult, newResult: ASTParseResult): {
    added: SymbolMetadata[];
    removed: SymbolMetadata[];
    modified: SymbolMetadata[];
  } {
    if (!oldResult.success || !newResult.success) {
      return { added: [], removed: [], modified: [] };
    }

    const oldSymbolsMap = new Map(oldResult.symbols.map(s => [s.fullPath || s.name, s]));
    const newSymbolsMap = new Map(newResult.symbols.map(s => [s.fullPath || s.name, s]));

    const added: SymbolMetadata[] = [];
    const removed: SymbolMetadata[] = [];
    const modified: SymbolMetadata[] = [];

    // 查找新增和修改的符号
    for (const [key, newSymbol] of newSymbolsMap.entries()) {
      const oldSymbol = oldSymbolsMap.get(key);
      if (!oldSymbol) {
        added.push(newSymbol);
      } else if (oldSymbol.hash !== newSymbol.hash) {
        modified.push(newSymbol);
      }
    }

    // 查找删除的符号
    for (const [key, oldSymbol] of oldSymbolsMap.entries()) {
      if (!newSymbolsMap.has(key)) {
        removed.push(oldSymbol);
      }
    }

    return { added, removed, modified };
  }
}
