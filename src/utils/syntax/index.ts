/**
 * 语法处理模块统一导出。
 * 向后兼容：保持与原 src/utils/syntaxHandler.ts 相同的公开 API。
 */
export { handleSpecialSyntax } from './dispatcher';
export { tokenizeWithQuotes, resolveFilePathsAndQuestion } from './resolver';
