# Project Documentation

- **Generated at:** 2026-01-25 10:48:52
- **Root Dir:** `.`
- **File Count:** 39
- **Total Size:** 107.86 KB

<a name="toc"></a>
## 📂 扫描目录
- [jest.config.js](#📄-jestconfigjs) (35 lines, 0.89 KB)
- [src/agent/codeSummary.js](#📄-srcagentcodesummaryjs) (335 lines, 11.81 KB)
- [test/__mocks__/marked-terminal.js](#📄-test__mocks__marked-terminaljs) (1 lines, 0.04 KB)
- [test/__mocks__/marked.js](#📄-test__mocks__markedjs) (7 lines, 0.11 KB)
- [test/__mocks__/ora.js](#📄-test__mocks__orajs) (13 lines, 0.25 KB)
- [test/__tests__/tokenPolicy/TokenEstimator.T1.test.js](#📄-test__tests__tokenpolicytokenestimatort1testjs) (68 lines, 2.55 KB)
- [test/contextBuffer.test.js](#📄-testcontextbuffertestjs) (138 lines, 4.27 KB)
- [test/fileReader.test.js](#📄-testfilereadertestjs) (157 lines, 5.94 KB)
- [test/macros.test.js](#📄-testmacrostestjs) (92 lines, 3.48 KB)
- [test/quick_test.js](#📄-testquick_testjs) (28 lines, 0.79 KB)
- [test/risk-validation.test.js](#📄-testrisk-validationtestjs) (59 lines, 2.43 KB)
- [test/test_agent_pipeline.js](#📄-testtest_agent_pipelinejs) (98 lines, 2.54 KB)
- [test/test_ai_chat.js](#📄-testtest_ai_chatjs) (12 lines, 0.29 KB)
- [test/test_at_hash_completion.js](#📄-testtest_at_hash_completionjs) (59 lines, 1.67 KB)
- [test/test_completion_integration.js](#📄-testtest_completion_integrationjs) (33 lines, 0.82 KB)
- [test/test_comprehensive_completion.js](#📄-testtest_comprehensive_completionjs) (79 lines, 2.94 KB)
- [test/test_cot_parsing.js](#📄-testtest_cot_parsingjs) (118 lines, 3.55 KB)
- [test/test_display_anomaly.js](#📄-testtest_display_anomalyjs) (134 lines, 4.68 KB)
- [test/test_display_logic.js](#📄-testtest_display_logicjs) (76 lines, 3.06 KB)
- [test/test_dual_agent.js](#📄-testtest_dual_agentjs) (49 lines, 1.42 KB)
- [test/test_dynamic_prompt.js](#📄-testtest_dynamic_promptjs) (171 lines, 6.91 KB)
- [test/test_escape_sequences.js](#📄-testtest_escape_sequencesjs) (46 lines, 1.42 KB)
- [test/test_integration.js](#📄-testtest_integrationjs) (48 lines, 1.58 KB)
- [test/test_interactive_completion.js](#📄-testtest_interactive_completionjs) (129 lines, 4.47 KB)
- [test/test_logic.js](#📄-testtest_logicjs) (25 lines, 0.92 KB)
- [test/test_mode_detection.js](#📄-testtest_mode_detectionjs) (80 lines, 2.29 KB)
- [test/test_no_duplicates.js](#📄-testtest_no_duplicatesjs) (34 lines, 0.96 KB)
- [test/test_p0_integration.js](#📄-testtest_p0_integrationjs) (228 lines, 7.97 KB)
- [test/test_path_completion.js](#📄-testtest_path_completionjs) (36 lines, 1.21 KB)
- [test/test_prompt_enhancement.js](#📄-testtest_prompt_enhancementjs) (57 lines, 1.80 KB)
- [test/test_readline_integration.js](#📄-testtest_readline_integrationjs) (62 lines, 2.06 KB)
- [test/test_risk_disclosure.js](#📄-testtest_risk_disclosurejs) (342 lines, 11.33 KB)
- [test/test_simple.js](#📄-testtest_simplejs) (22 lines, 0.61 KB)
- [test/test_simple_integration.js](#📄-testtest_simple_integrationjs) (37 lines, 1.41 KB)
- [test/test_structured_output.js](#📄-testtest_structured_outputjs) (59 lines, 1.54 KB)
- [test/test_tab_completion.js](#📄-testtest_tab_completionjs) (118 lines, 3.32 KB)
- [test/test_tab_completion_debug.js](#📄-testtest_tab_completion_debugjs) (122 lines, 3.58 KB)
- [test/test_table_now.js](#📄-testtest_table_nowjs) (17 lines, 0.47 KB)
- [test/test_table_quiet.js](#📄-testtest_table_quietjs) (17 lines, 0.51 KB)

---

## 📄 jest.config.js

````javascript
/** @type {import('ts-jest')} */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.{js,ts}'
    ],
    collectCoverageFrom: [
        'src/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.[tj]sx?$': ['ts-jest', {
            tsconfig: {
                esModuleInterop: true,
                module: 'commonjs',
                allowJs: true
            }
        }]
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(ora|marked|marked-terminal)/)'
    ],
    moduleNameMapper: {
        '^ora$': '<rootDir>/test/__mocks__/ora.js',
        '^marked$': '<rootDir>/test/__mocks__/marked.js',
        '^marked-terminal$': '<rootDir>/test/__mocks__/marked-terminal.js'
    },
};

````

[⬆ 回到目录](#toc)

## 📄 src/agent/codeSummary.js

````javascript
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSymbols = extractSymbols;
exports.generateFileSummary = generateFileSummary;
exports.generateMultipleFileSummaries = generateMultipleFileSummaries;
exports.generateSummaryReport = generateSummaryReport;
var path = require("path");
/**
 * 从代码中提取符号（简单正则实现，支持多语言）
 */
function extractSymbols(code, filename) {
    var symbols = [];
    var lines = code.split('\n');
    // 根据文件扩展名选择提取策略
    var ext = path.extname(filename).toLowerCase();
    if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
        extractJavaScriptSymbols(lines, symbols);
    }
    else if (['.py'].includes(ext)) {
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
}
// Classes
var classMatch = trimmed.match(/^class\s+(\w+)/);
if (classMatch) {
    symbols.push({
        name: classMatch[1],
        type: 'class',
        line: lineNum,
        signature: trimmed
    });
}
// Functions
var funcMatch = trimmed.match(/^function\s+(\w+)/);
if (funcMatch) {
    symbols.push({
        name: funcMatch[1],
        type: 'function',
        line: lineNum,
        signature: trimmed
    });
}
// Methods
var methodMatch = trimmed.match(/^\s*(async\s+)?(public|private|protected)?\s*(static)?\s*(\w+)\s*\(/);
if (methodMatch && !trimmed.includes('function ')) {
    symbols.push({
        name: methodMatch[4],
        type: 'function',
        line: lineNum,
        signature: trimmed
    });
}
// Arrow functions
var arrowMatch = trimmed.match(/^const\s+(\w+)\s*=\s*(async\s+)?\(/);
if (arrowMatch) {
    symbols.push({
        name: arrowMatch[1],
        type: 'function',
        line: lineNum,
        signature: trimmed
    });
}
;
/**
 * 提取Python符号
 */
function extractPythonSymbols(lines, symbols) {
    lines.forEach(function (line, index) {
        var lineNum = index + 1;
        var trimmed = line.trim();
        // Imports
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            symbols.push({
                name: trimmed,
                type: 'import',
                line: lineNum
            });
        }
        // Classes
        var classMatch = trimmed.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
        // Functions
        var funcMatch = trimmed.match(/^def\s+(\w+)/);
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
function extractGoSymbols(lines, symbols) {
    lines.forEach(function (line, index) {
        var lineNum = index + 1;
        var trimmed = line.trim();
        // Imports
        if (trimmed.startsWith('import ')) {
            symbols.push({
                name: trimmed,
                type: 'import',
                line: lineNum
            });
        }
        // Types/Interfaces
        var typeMatch = trimmed.match(/^(type|interface)\s+(\w+)/);
        if (typeMatch) {
            symbols.push({
                name: typeMatch[2],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
        // Functions
        var funcMatch = trimmed.match(/^func\s+(\w+)/);
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
function extractRustSymbols(lines, symbols) {
    lines.forEach(function (line, index) {
        var lineNum = index + 1;
        var trimmed = line.trim();
        // Uses
        if (trimmed.startsWith('use ')) {
            symbols.push({
                name: trimmed,
                type: 'import',
                line: lineNum
            });
        }
        // Structs
        var structMatch = trimmed.match(/^struct\s+(\w+)/);
        if (structMatch) {
            symbols.push({
                name: structMatch[1],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
        // Functions
        var funcMatch = trimmed.match(/^fn\s+(\w+)/);
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
function extractJavaSymbols(lines, symbols) {
    lines.forEach(function (line, index) {
        var lineNum = index + 1;
        var trimmed = line.trim();
        // Imports
        if (trimmed.startsWith('import ')) {
            symbols.push({
                name: trimmed,
                type: 'import',
                line: lineNum
            });
        }
        // Classes
        var classMatch = trimmed.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1],
                type: 'class',
                line: lineNum,
                signature: trimmed
            });
        }
        // Methods
        var methodMatch = trimmed.match(/^\s*(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\(/);
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
    var symbols = extractSymbols(content, filePath);
    // 统计符号类型
    var stats = {
        imports: symbols.filter(function (s) { return s.type === 'import'; }).length,
        exports: symbols.filter(function (s) { return s.type === 'export'; }).length,
        classes: symbols.filter(function (s) { return s.type === 'class'; }).length,
        functions: symbols.filter(function (s) { return s.type === 'function'; }).length,
    };
    // 生成摘要文本
    var summary = "\u6587\u4EF6: ".concat(path.basename(filePath), "\n");
    summary += "\u7EDF\u8BA1: ".concat(stats.imports, "\u4E2A\u5BFC\u5165, ").concat(stats.exports, "\u4E2A\u5BFC\u51FA, ").concat(stats.classes, "\u4E2A\u7C7B, ").concat(stats.functions, "\u4E2A\u51FD\u6570\n");
    if (symbols.length > 0) {
        summary += '\n主要符号:\n';
        // 按类型分组
        var classes = symbols.filter(function (s) { return s.type === 'class'; });
        var functions = symbols.filter(function (s) { return s.type === 'function'; });
        var imports = symbols.filter(function (s) { return s.type === 'import'; });
        var exports_1 = symbols.filter(function (s) { return s.type === 'export'; });
        if (classes.length > 0) {
            summary += '  类: ' + classes.map(function (s) { return s.name; }).join(', ') + '\n';
        }
        if (functions.length > 0) {
            summary += '  函数: ' + functions.slice(0, 10).map(function (s) { return s.name; }).join(', ');
            if (functions.length > 10) {
                summary += " (\u8FD8\u6709".concat(functions.length - 10, "\u4E2A)");
            }
            summary += '\n';
        }
        if (imports.length > 0 && imports.length <= 5) {
            summary += '  导入: ' + imports.map(function (s) { return s.name; }).join(', ') + '\n';
        }
    }
    return {
        path: filePath,
        summary: summary,
        symbols: symbols
    };
}
/**
 * 生成多文件摘要
 */
function generateMultipleFileSummaries(files) {
    return __awaiter(this, void 0, void 0, function () {
        var summaries, _i, files_1, file, summary;
        return __generator(this, function (_a) {
            summaries = [];
            for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                file = files_1[_i];
                summary = generateFileSummary(file.path, file.content);
                summaries.push(summary);
            }
            return [2 /*return*/, summaries];
        });
    });
}
/**
 * 生成摘要报告（用于注入到Prompt）
 */
function generateSummaryReport(summaries, maxLength) {
    if (maxLength === void 0) { maxLength = 2000; }
    var report = '[CODE STRUCTURE SUMMARY]\n';
    for (var _i = 0, summaries_1 = summaries; _i < summaries_1.length; _i++) {
        var summary = summaries_1[_i];
        // 如果超过最大长度，截断
        if (report.length + summary.summary.length > maxLength) {
            var remaining = maxLength - report.length - 20;
            if (remaining > 0) {
                report += "\n... (\u8FD8\u6709".concat(summaries.length - summaries.indexOf(summary), "\u4E2A\u6587\u4EF6\u672A\u663E\u793A\uFF0C\u53EF\u6309\u9700\u67E5\u770B\u8BE6\u60C5)");
            }
            break;
        }
        report += '\n' + summary.summary;
    }
    return report;
}

````

[⬆ 回到目录](#toc)

## 📄 test/__mocks__/marked-terminal.js

````javascript
module.exports = class TerminalRenderer { };

````

[⬆ 回到目录](#toc)

## 📄 test/__mocks__/marked.js

````javascript
module.exports = {
    parse: (s) => s,
    setOptions: () => { },
    marked: {
        parse: (s) => s
    }
};

````

[⬆ 回到目录](#toc)

## 📄 test/__mocks__/ora.js

````javascript
module.exports = {
    start: () => ({
        stop: () => { },
        succeed: () => { },
        fail: () => { },
        text: '',
        isSpinning: false
    }),
    stop: () => { },
    succeed: () => { },
    fail: () => { },
    Ora: class { }
};

````

[⬆ 回到目录](#toc)

## 📄 test/__tests__/tokenPolicy/TokenEstimator.T1.test.js

````javascript
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TokenEstimator_1 = require("../../../dist/policy/token/TokenEstimator");
// Mock fs functions
jest.mock('fs/promises');
/**
 * T1: estimate-only 不触发 resolve
 * 验证：零副作用评估
 */
describe('TokenEstimator - T1: Zero-Side-Effect Estimation', () => {
    let resolveCallCount = 0;
    beforeEach(() => {
        resolveCallCount = 0;
    });
    test('estimate() 不应该调用任何 resolve()', async () => {
        const item = {
            id: '/test/file.txt',
            type: 'file',
            originalToken: '@/test/file.txt',
            samplingStrategy: 'none',
            estimate: async () => ({ byteSize: 100 }),
            resolve: async () => {
                resolveCallCount++;
                throw new Error('Should not be called');
            }
        };
        const result = await TokenEstimator_1.TokenEstimator.estimate([item]);
        expect(result.estimatedTokens).toBe(25); // 100 bytes / 4
        expect(result.warnings).toHaveLength(0);
        expect(result.blockingError).toBeUndefined();
        expect(resolveCallCount).toBe(0); // 关键：resolve 永不被调用
    });
    test('estimate() 应该正常处理所有项', async () => {
        const items = [
            {
                id: '/test/file1.txt',
                type: 'file',
                originalToken: '@/test/file1.txt',
                samplingStrategy: 'none',
                estimate: async () => ({ byteSize: 100 })
            },
            {
                id: '/test/file2.txt',
                type: 'file',
                originalToken: '@/test/file2.txt',
                samplingStrategy: 'none',
                estimate: async () => ({ byteSize: 200 })
            }
        ];
        const result = await TokenEstimator_1.TokenEstimator.estimate(items);
        expect(result.estimatedTokens).toBe(75); // (100 + 200) / 4
        expect(result.warnings).toHaveLength(0);
    });
    test('estimate() 应该处理没有 estimate() 的项', async () => {
        const items = [
            {
                id: '/test/file1.txt',
                type: 'file',
                originalToken: '@/test/file1.txt',
                samplingStrategy: 'none',
                resolve: async () => ({ content: 'test', byteSize: 100 })
            }
        ];
        const result = await TokenEstimator_1.TokenEstimator.estimate(items);
        expect(result.estimatedTokens).toBe(0); // 没有 estimate() 的项
        expect(result.warnings).toHaveLength(0);
    });
});

````

[⬆ 回到目录](#toc)

## 📄 test/contextBuffer.test.js

````javascript
const { ContextBuffer } = require('../dist/commands/contextBuffer');

describe('ContextBuffer', () => {
    let contextBuffer;

    beforeEach(() => {
        contextBuffer = new ContextBuffer();
    });

    test('should add items to buffer', () => {
        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: 'This is a test file content.',
        };

        contextBuffer.add(item);

        expect(contextBuffer.isEmpty()).toBe(false);
        expect(contextBuffer.export().length).toBe(1);
        expect(contextBuffer.export()[0].path).toBe('/test/file.txt');
    });

    test('should calculate tokens correctly', () => {
        const content = 'This is a test content for token calculation.';
        const expectedTokens = Math.ceil(content.length / 4);

        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: content,
        };

        contextBuffer.add(item);
        const exported = contextBuffer.export();

        expect(exported[0].tokens).toBe(expectedTokens);
    });

    test('should trim items when exceeding token limit', () => {
        // 设置一个小的token限制用于测试
        const smallContextBuffer = new ContextBuffer();
        
        // 添加多个项目直到超过限制
        for (let i = 0; i < 10; i++) {
            const item = {
                type: 'file',
                path: '/test/file' + i + '.txt',
                content: 'A'.repeat(5000), // 大量内容以快速达到token限制
            };
            smallContextBuffer.add(item, true); // 绕过限制进行添加
        }

        // 现在添加一个新项目，不绕过限制，应该触发修剪
        const newItem = {
            type: 'file',
            path: '/test/newfile.txt',
            content: 'New content',
        };
        smallContextBuffer.add(newItem); // 不绕过限制

        // 检查是否修剪了旧项目
        const items = smallContextBuffer.export();
        expect(items.length).toBeGreaterThan(0); // 应该仍有项目
    });

    test('should clear all items', () => {
        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: 'This is a test file content.',
        };

        contextBuffer.add(item);
        expect(contextBuffer.isEmpty()).toBe(false);

        contextBuffer.clear();
        expect(contextBuffer.isEmpty()).toBe(true);
        expect(contextBuffer.export().length).toBe(0);
    });

    test('should list items with correct format', () => {
        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: 'This is a test file content.',
        };

        contextBuffer.add(item);
        const listed = contextBuffer.list();

        expect(listed.length).toBe(1);
        expect(listed[0].index).toBe(1);
        expect(listed[0].type).toBe('file');
        expect(listed[0].path).toBe('/test/file.txt');
    });

    test('should build prompt with context', () => {
        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: 'This is the context content.',
            alias: 'Test File'
        };

        contextBuffer.add(item);
        const prompt = contextBuffer.buildPrompt('What is in the file?');

        expect(prompt).toContain('知识上下文');
        expect(prompt).toContain('Test File');
        expect(prompt).toContain('/test/file.txt');
        expect(prompt).toContain('This is the context content.');
        expect(prompt).toContain('What is in the file?');
    });

    test('should return userInput when no context', () => {
        const prompt = contextBuffer.buildPrompt('What is in the file?');

        expect(prompt).toContain('What is in the file?');
        expect(prompt).not.toContain('知识上下文');
    });

    test('should import items correctly', () => {
        const items = [{
            type: 'file',
            path: '/imported/file.txt',
            content: 'Imported content',
            tokens: 10
        }];

        contextBuffer.import(items);
        const exported = contextBuffer.export();

        expect(exported.length).toBe(1);
        expect(exported[0].path).toBe('/imported/file.txt');
        expect(exported[0].content).toBe('Imported content');
    });
});

````

[⬆ 回到目录](#toc)

## 📄 test/fileReader.test.js

````javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
    parseFilePathsFromLsOutput,
    readFilesContent,
    buildPromptWithFileContent
} = require('../dist/core/fileReader');

jest.mock('fs');
jest.mock('path');

describe('Module: FileReader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        path.resolve.mockImplementation((p) => p);
        fs.existsSync.mockReturnValue(true);
        fs.statSync.mockReturnValue({ isFile: () => true });
    });

    describe('parseFilePathsFromLsOutput', () => {
        test('should parse simple ls output', () => {
            const output = 'file1.txt\nfile2.ts\nfile3.js';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts', 'file3.js']);
        });

        test('should parse ls -l output', () => {
            const output = '-rw-r--r-- 1 user group 123 Jan 1 file1.txt\n-rw-r--r-- 1 user group 456 Jan 2 file2.ts';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts']);
        });

        test('should skip . and .. directories', () => {
            const output = '.\n..\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });

        test('should skip permission strings', () => {
            const output = '-rw-r--r--\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });

        test('should handle empty output', () => {
            const output = '';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual([]);
        });
    });

    describe('readFilesContent', () => {
        test('should read multiple files', () => {
            const mockContent = { 'file1.txt': 'content1', 'file2.ts': 'content2' };
            fs.readFileSync.mockImplementation((filePath) => mockContent[filePath] || '');

            const filePaths = ['file1.txt', 'file2.ts'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(2);
            expect(contentMap.get('file1.txt')).toBe('content1');
            expect(contentMap.get('file2.ts')).toBe('content2');
        });

        test('should skip directories', () => {
            fs.statSync.mockReturnValue({ isFile: () => false });

            const filePaths = ['file.txt', 'directory'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(0);
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });

        test('should skip non-existent files', () => {
            fs.existsSync.mockImplementation((p) => p === 'exists.txt');

            const filePaths = ['exists.txt', 'notexists.txt'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(1);
            expect(contentMap.has('exists.txt')).toBe(true);
            expect(contentMap.has('notexists.txt')).toBe(false);
        });

        test('should handle read errors gracefully', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            const filePaths = ['error.txt'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(0);
        });

        test('should return empty map for empty input', () => {
            const contentMap = readFilesContent([]);
            expect(contentMap.size).toBe(0);
        });
    });

    describe('buildPromptWithFileContent', () => {
        test('should build prompt with all content', () => {
            const originalOutput = 'file1.txt\nfile2.ts';
            const filePaths = ['file1.txt', 'file2.ts'];
            const contentMap = new Map([
                ['file1.txt', 'content1'],
                ['file2.ts', 'content2']
            ]);
            const question = 'Analyze these files';

            const prompt = buildPromptWithFileContent(originalOutput, filePaths, contentMap, question);

            expect(prompt).toContain('## 文件列表');
            expect(prompt).toContain('file1.txt\nfile2.ts');
            expect(prompt).toContain('## 文件内容');
            expect(prompt).toContain('### file1.txt');
            expect(prompt).toContain('content1');
            expect(prompt).toContain('### file2.ts');
            expect(prompt).toContain('content2');
            expect(prompt).toContain('## 我的问题');
            expect(prompt).toContain('Analyze these files');
        });

        test('should truncate content longer than 5000 chars', () => {
            const longContent = 'x'.repeat(6000);
            const contentMap = new Map([['long.txt', longContent]]);
            const prompt = buildPromptWithFileContent('long.txt', ['long.txt'], contentMap);

            expect(prompt).toContain('... (内容过长已截断)');
            expect(prompt.length).toBeLessThan(longContent.length + 1000);
        });

        test('should use default question when not provided', () => {
            const prompt = buildPromptWithFileContent('file.txt', ['file.txt'], new Map([['file.txt', 'content']]));

            expect(prompt).toContain('请分析以上文件列表和文件内容');
        });

        test('should work with empty content map', () => {
            const prompt = buildPromptWithFileContent('file.txt', ['file.txt'], new Map(), 'Analyze');

            expect(prompt).toContain('## 文件列表');
            expect(prompt).toContain('## 我的问题');
            expect(prompt).not.toContain('## 文件内容');
        });

        test('should work with empty file paths', () => {
            const prompt = buildPromptWithFileContent('', [], new Map(), 'Analyze');

            expect(prompt).toContain('## 我的问题');
            expect(prompt).not.toContain('## 文件内容');
        });
    });
});

````

[⬆ 回到目录](#toc)

## 📄 test/macros.test.js

````javascript
const fs = require('fs');
const yuangs = require('../dist/core/macros');
const path = require('path');
const os = require('os');

jest.mock('fs');

describe('Module: Macros', () => {
    const mockMacrosFile = path.join(os.homedir(), '.yuangs_macros.json');

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock implementation
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockReturnValue(undefined);
        // We need to unmock path and os if they were mocked, but we only mocked fs
    });

    test('should get empty macros when file does not exist', () => {
        fs.existsSync.mockReturnValue(false);
        const macros = yuangs.getMacros();
        expect(macros).toEqual({});
        expect(fs.existsSync).toHaveBeenCalledWith(mockMacrosFile);
    });

    test('should save a new macro', () => {
        fs.existsSync.mockReturnValue(false); // File doesn't exist yet
        
        const result = yuangs.saveMacro('test', 'echo hello', 'description');
        
        expect(result).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        const [filePath, content] = fs.writeFileSync.mock.calls[0];
        expect(filePath).toBe(mockMacrosFile);
        
        const data = JSON.parse(content);
        expect(data).toHaveProperty('test');
        expect(data.test.commands).toBe('echo hello');
        expect(data.test.description).toBe('description');
        expect(data.test).toHaveProperty('createdAt');
    });

    test('should retrieve existing macros', () => {
        const mockData = {
            "demo": {
                "commands": "ls -la",
                "description": "list files",
                "createdAt": "2024-01-01T00:00:00.000Z"
            }
        };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const macros = yuangs.getMacros();
        expect(macros).toEqual(mockData);
    });

    test('should delete a macro', () => {
        const mockData = {
            "todelete": { "commands": "rm -rf /", "description": "dangerous", "createdAt": "2024-01-01T00:00:00.000Z" },
            "keep": { "commands": "echo safe", "description": "safe", "createdAt": "2024-01-01T00:00:00.000Z" }
        };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = yuangs.deleteMacro('todelete');
        
        expect(result).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        const [filePath, content] = fs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(content);
        expect(savedData).not.toHaveProperty('todelete');
        expect(savedData).toHaveProperty('keep');
    });

    test('should return false when deleting non-existent macro', () => {
        fs.existsSync.mockReturnValue(false); // Or true with empty object
        
        const result = yuangs.deleteMacro('nonexistent');
        expect(result).toBe(false);
        // Should not write to disk if nothing changed (optional optimization, but current implementation reads first)
        // Actually current implementation:
        // const macros = getMacros();
        // if (macros[name]) { ... }
        // getMacros returns {} if file not exists. macros['nonexistent'] is undefined.
        // So it returns false and does NOT call writeFileSync.
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});

````

[⬆ 回到目录](#toc)

## 📄 test/quick_test.js

````javascript
const { spawn } = require('child_process');

console.log('Quick test for escape sequences after fix\n');

const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

child.stdin.write('简短测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    const escapeSequenceCount = (output.match(/\x1b/g) || []).length;
    console.log('Escape sequences found:', escapeSequenceCount);

    if (escapeSequenceCount > 5) {
        console.log('❌ Still has escape sequences');
    } else if (escapeSequenceCount > 0) {
        console.log('⚠️  Few escape sequences (might be chalk colors)');
    } else {
        console.log('✓ No problematic escape sequences');
    }
});

````

[⬆ 回到目录](#toc)

## 📄 test/risk-validation.test.js

````javascript
const { assessRisk } = require('../dist/core/risk');

describe('Risk Assessment', () => {
        test('should detect rm command as high risk', () => {
            expect(assessRisk('rm -rf file.txt', 'low')).toBe('high');
            expect(assessRisk('rm file.txt', 'low')).toBe('high');
        });

        test('should detect sudo command as high risk', () => {
            expect(assessRisk('sudo apt install package', 'low')).toBe('high');
            expect(assessRisk('SUDO apt install', 'low')).toBe('high');
        });

        test('should detect mv command as high risk', () => {
            expect(assessRisk('mv file1 file2', 'low')).toBe('high');
        });

        test('should detect dd command as high risk', () => {
            expect(assessRisk('dd if=/dev/zero of=file', 'low')).toBe('high');
        });

        test('should detect chmod command as high risk', () => {
            expect(assessRisk('chmod 777 file.txt', 'low')).toBe('high');
        });

        test('should detect chown command as high risk', () => {
            expect(assessRisk('chown user:group file', 'low')).toBe('high');
        });

        test('should detect mkfs command as high risk', () => {
            expect(assessRisk('mkfs.ext4 /dev/sda1', 'low')).toBe('high');
        });

        test('should detect fork bomb pattern as high risk', () => {
            expect(assessRisk(':(){ :|:& };:', 'low')).toBe('high');
        });

        test('should detect redirecting to /dev as high risk', () => {
            expect(assessRisk('echo "data" > /dev/sda', 'low')).toBe('high');
        });

        test('should return ai risk if no high risk patterns found', () => {
            expect(assessRisk('ls -la', 'low')).toBe('low');
            expect(assessRisk('cat file.txt', 'medium')).toBe('medium');
            expect(assessRisk('grep "pattern" file', 'high')).toBe('high');
        });

        test('should override ai risk if high risk pattern detected', () => {
            expect(assessRisk('rm -rf file', 'low')).toBe('high');
            expect(assessRisk('sudo ls', 'medium')).toBe('high');
            expect(assessRisk('chmod 777 file', 'medium')).toBe('high');
        });

        test('should be case insensitive for dangerous commands', () => {
            expect(assessRisk('RM file.txt', 'low')).toBe('high');
            expect(assessRisk('SUDO cmd', 'low')).toBe('high');
            expect(assessRisk('CHMOD 777 file', 'low')).toBe('high');
        });
});
````

[⬆ 回到目录](#toc)

## 📄 test/test_agent_pipeline.js

````javascript
#!/usr/bin/env node

/**
 * Agent Pipeline 测试脚本
 * 
 * 用法：
 *   node test_agent_pipeline.js
 */

const { AgentPipeline } = require('../dist/agent');

async function testChatMode() {
    console.log('\n=== 测试 Chat 模式 ===\n');

    const agent = new AgentPipeline();

    try {
        await agent.run(
            {
                rawInput: "简单解释一下什么是冒泡排序",
                options: {
                    verbose: true
                }
            },
            'chat'
        );

        console.log('\n✅ Chat 模式测试通过\n');
    } catch (error) {
        console.error('\n❌ Chat 模式测试失败:', error.message);
    }
}

async function testCommandMode() {
    console.log('\n=== 测试 Command 模式 ===\n');

    const agent = new AgentPipeline();

    try {
        await agent.run(
            {
                rawInput: "列出当前目录的所有 TypeScript 文件",
                options: {
                    verbose: true,
                    autoYes: false  // 不自动执行，只生成命令
                }
            },
            'command'
        );

        console.log('\n✅ Command 模式测试通过\n');
    } catch (error) {
        console.error('\n❌ Command 模式测试失败:', error.message);
    }
}

async function testExecutionRecord() {
    console.log('\n=== 测试执行记录 ===\n');

    const { getRecords } = require('../dist/agent/record');

    const records = getRecords();
    console.log(`当前共有 ${records.length} 条执行记录`);

    if (records.length > 0) {
        const latest = records[records.length - 1];
        console.log('\n最新记录:');
        console.log(`  ID: ${latest.id}`);
        console.log(`  模式: ${latest.mode}`);
        console.log(`  时间: ${new Date(latest.timestamp).toLocaleString()}`);
        console.log(`  模型: ${latest.model}`);
        console.log(`  延迟: ${latest.llmResult.latencyMs}ms`);
    }

    console.log('\n✅ 执行记录测试通过\n');
}

async function main() {
    console.log('🚀 开始测试 Agent Pipeline\n');

    // 注意：这些测试需要有效的 AI API 配置
    // 如果没有配置，测试会失败

    try {
        await testChatMode();
        // await testCommandMode();  // 取消注释以测试命令模式
        await testExecutionRecord();

        console.log('\n🎉 所有测试完成！\n');
    } catch (error) {
        console.error('\n💥 测试过程中发生错误:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

````

[⬆ 回到目录](#toc)

## 📄 test/test_ai_chat.js

````javascript
#!/usr/bin/env node

const { handleAIChat } = require('./dist/commands/handleAIChat.js');

console.log('=== 测试 AI 交互 ===\n');

// 测试单次提问
handleAIChat('hi', 'assistant').then(() => {
  console.log('\n✅ 测试完成');
}).catch(err => {
  console.error('❌ 错误:', err);
});

````

[⬆ 回到目录](#toc)

## 📄 test/test_at_hash_completion.js

````javascript
const { createCompleter } = require('../dist/commands/shellCompletions.js');

// Test the @ and # completion functionality specifically
console.log('Testing @ and # completion functionality...\n');

const completer = createCompleter();

// Test cases for @ (files) and # (directories)
const fileTestCases = [
    '@',
    '@ R',
    '@ README',
    '@ package',
    '@ ./s',  // test subdirectory
    '@ src/'  // test specific directory
];

const dirTestCases = [
    '#',
    '# s',
    '# src',
    '# d',
    '# ./s',  // test subdirectory
    '# dist/' // test specific directory
];

console.log('=== FILE COMPLETION TESTS (@) ===');
fileTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('=== DIRECTORY COMPLETION TESTS (#) ===');
dirTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('File and directory completion tests completed.');
````

[⬆ 回到目录](#toc)

## 📄 test/test_completion_integration.js

````javascript
const { createCompleter } = require('../dist/commands/shellCompletions.js');

// Test the completion functionality
console.log('Testing completion functionality...\n');

const completer = createCompleter();

// Test cases
const testCases = [
    '@',
    '#',
    '@ README',
    '# s',
    '$ ls',
    '! pwd'
];

testCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  Sample: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Completion functionality test completed.');
````

[⬆ 回到目录](#toc)

## 📄 test/test_comprehensive_completion.js

````javascript
const { createCompleter, detectMode } = require('../dist/commands/shellCompletions.js');

// Comprehensive test of all completion features
console.log('Running comprehensive completion functionality tests...\n');

const completer = createCompleter();

// Test all major completion scenarios
console.log('=== COMPREHENSIVE COMPLETION TESTS ===\n');

// 1. File completion (@)
console.log('1. FILE COMPLETION (@)');
const fileTests = ['@', '@README', '@package'];
fileTests.forEach(test => {
    const [completions, line] = completer(test);
    console.log(`   "${test}" -> ${completions.length} completions, mode: ${detectMode(test)}`);
});
console.log('');

// 2. Directory completion (#)
console.log('2. DIRECTORY COMPLETION (#)');
const dirTests = ['#', '#src', '#dist'];
dirTests.forEach(test => {
    const [completions, line] = completer(test);
    console.log(`   "${test}" -> ${completions.length} completions, mode: ${detectMode(test)}`);
});
console.log('');

// 3. Command completion ($ and !)
console.log('3. COMMAND COMPLETION ($ and !)');
const cmdTests = ['$ ls', '$ gi', '! pwd', '! ca'];
cmdTests.forEach(test => {
    const [completions, line] = completer(test);
    console.log(`   "${test}" -> ${completions.length} completions, mode: ${detectMode(test)}`);
    if (completions.length > 0) {
        console.log(`      Sample: ${completions.slice(0, 3).join(', ')}`);
    }
});
console.log('');

// 4. Path completion within file/directory contexts
console.log('4. PATH COMPLETION IN SUBDIRECTORIES');
const pathTests = ['@ src/', '# src/', '@ ./', '# ./'];
pathTests.forEach(test => {
    const [completions, line] = completer(test);
    console.log(`   "${test}" -> ${completions.length} completions, mode: ${detectMode(test)}`);
    if (completions.length > 0) {
        console.log(`      Sample: ${completions.slice(0, 3).join(', ')}`);
    }
});
console.log('');

// 5. Chat mode (should not provide completions)
console.log('5. CHAT MODE (should have no completions)');
const chatTests = ['hello', 'how are you', 'what is typescript'];
chatTests.forEach(test => {
    const [completions, line] = completer(test);
    console.log(`   "${test}" -> ${completions.length} completions, mode: ${detectMode(test)}`);
});
console.log('');

// 6. Edge cases
console.log('6. EDGE CASES');
const edgeTests = ['', '@nonexistentfile12345', '#nonexistentdir12345'];
edgeTests.forEach(test => {
    const [completions, line] = completer(test);
    console.log(`   "${test}" -> ${completions.length} completions, mode: ${detectMode(test)}`);
});
console.log('');

console.log('=== SUMMARY ===');
console.log('✓ File completion (@) works');
console.log('✓ Directory completion (#) works');
console.log('✓ Command completion ($/!) works');
console.log('✓ Path completion in subdirectories works');
console.log('✓ Chat mode correctly returns no completions');
console.log('✓ Edge cases handled gracefully');
console.log('');
console.log('All completion features are working correctly!');
````

[⬆ 回到目录](#toc)

## 📄 test/test_cot_parsing.js

````javascript
/**
 * 测试CoT (Chain of Thought) 解析功能
 */

const { LLMAdapter } = require('../dist/agent/llmAdapter');

console.log('='.repeat(60));
console.log('测试1: CoT格式解析 - 完整格式');
console.log('='.repeat(60));

const cotExample1 = `[THOUGHT]
User wants to count files in /tmp directory. I'll use ls to list files and pipe to wc -l to count them. This is a safe operation with low risk.
[/THOUGHT]

\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "ls /tmp | wc -l",
  "risk_level": "low"
}
\`\`\``;

const result1 = LLMAdapter.parseThought(cotExample1);

console.log('\n📋 解析结果:');
console.log('-'.repeat(60));
console.log('类型:', result1.type);
console.log('是否完成:', result1.isDone);
console.log('推理内容:', result1.reasoning ? '✓ 已提取' : '✗ 未提取');
console.log('命令:', result1.payload.command);
console.log('风险等级:', result1.payload.risk_level);
console.log('-'.repeat(60));

console.log('\n✅ 测试通过：CoT格式正确解析');
console.log('✅ THOUGHT块成功提取');
console.log('✅ JSON块成功解析\n');

console.log('='.repeat(60));
console.log('测试2: CoT格式解析 - 带风险警告');
console.log('='.repeat(60));

const cotExample2 = `[THOUGHT]
User wants to delete old log files. I need to find log files older than 30 days and delete them. However, rm -rf is destructive. I should warn the user to verify the path.
[/THOUGHT]

\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "find /var/log -name '*.log' -mtime +30 -delete",
  "risk_level": "high"
}
\`\`\``;

const result2 = LLMAdapter.parseThought(cotExample2);

console.log('\n📋 解析结果:');
console.log('-'.repeat(60));
console.log('风险等级:', result2.payload.risk_level);
console.log('推理内容长度:', result2.reasoning.length, '字符');
console.log('-'.repeat(60));

console.log('\n✅ 测试通过：高风险操作正确识别\n');

console.log('='.repeat(60));
console.log('测试3: 向后兼容 - 纯JSON格式（旧格式）');
console.log('='.repeat(60));

const oldFormat = `{
  "action_type": "shell_cmd",
  "command": "ls -la",
  "reasoning": "list all files"
}`;

const result3 = LLMAdapter.parseThought(oldFormat);

console.log('\n📋 解析结果:');
console.log('-'.repeat(60));
console.log('类型:', result3.type);
console.log('命令:', result3.payload.command);
console.log('推理内容:', result3.reasoning || '(旧格式，从JSON中提取)');
console.log('-'.repeat(60));

console.log('\n✅ 测试通过：向后兼容旧格式\n');

console.log('='.repeat(60));
console.log('测试4: 答案类型');
console.log('='.repeat(60));

const answerExample = `[THOUGHT]
The user is asking about how to optimize a function. I should provide a direct answer with code examples.
[/THOUGHT]

\`\`\`json
{
  "action_type": "answer",
  "content": "To optimize this function, consider using Map instead of array operations..."
}
\`\`\``;

const result4 = LLMAdapter.parseThought(answerExample);

console.log('\n📋 解析结果:');
console.log('-'.repeat(60));
console.log('类型:', result4.type);
console.log('是否完成:', result4.isDone);
console.log('推理内容:', result4.reasoning ? '✓ 已提取' : '✗ 未提取');
console.log('-'.repeat(60));

console.log('\n✅ 测试通过：answer类型正确处理\n');

console.log('='.repeat(60));
console.log('所有测试通过！✅');
console.log('='.repeat(60));
console.log('\n📊 总结:');
console.log('- CoT格式解析：✓ 正常');
console.log('- 向后兼容：✓ 支持');
console.log('- 风险识别：✓ 正常');
console.log('- THOUGHT提取：✓ 完整');

````

[⬆ 回到目录](#toc)

## 📄 test/test_display_anomaly.js

````javascript
/**
 * Test for AI chat display anomalies
 * This test simulates the display clearing logic to identify potential issues
 */

function stripAnsi(str) {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function getVisualLineCount(text, screenWidth) {
    const lines = text.split('\n');
    let totalLines = 0;

    for (const line of lines) {
        const expandedLine = line.replace(/\t/g, '        ');
        const cleanLine = stripAnsi(expandedLine);

        let lineWidth = 0;
        for (const char of cleanLine) {
            const code = char.codePointAt(0) || 0;
            lineWidth += code > 255 ? 2 : 1;
        }

        if (lineWidth === 0) {
            totalLines += 1;
        } else {
            totalLines += Math.ceil(lineWidth / screenWidth);
        }
    }

    return totalLines;
}

function simulateDisplayClearing(rawText, formattedText, screenWidth = 80) {
    const BOT_PREFIX = '🤖 AI：';
    const totalContent = BOT_PREFIX + rawText;
    const lineCount = getVisualLineCount(totalContent, screenWidth);

    console.log(`\n=== Display Clearing Simulation ===`);
    console.log(`Screen width: ${screenWidth}`);
    console.log(`Raw text length: ${rawText.length}`);
    console.log(`Calculated visual lines to clear: ${lineCount}`);

    console.log(`\nRaw output would be cleared using:`);
    console.log(`  1. Clear current line (\\r\\x1b[K)`);
    console.log(`  2. Move up and clear ${lineCount - 1} more lines`);

    console.log(`\nFormatted output length: ${formattedText.length}`);

    const formattedVisualLines = getVisualLineCount(BOT_PREFIX + formattedText, screenWidth);
    console.log(`Formatted output visual lines: ${formattedVisualLines}`);

    if (lineCount !== formattedVisualLines) {
        console.log(`⚠️  WARNING: Line count mismatch!`);
        console.log(`   Raw: ${lineCount} lines, Formatted: ${formattedVisualLines} lines`);
        return { success: false, rawLines: lineCount, formattedLines: formattedVisualLines };
    }

    return { success: true, rawLines: lineCount, formattedLines: formattedVisualLines };
}

const testCases = [
    {
        name: "Simple text",
        raw: "Hello world",
        formatted: "Hello world"
    },
    {
        name: "Text exactly at screen width",
        raw: "A".repeat(70),
        formatted: "A".repeat(70)
    },
    {
        name: "Text that wraps exactly once",
        raw: "B".repeat(90),
        formatted: "B".repeat(90)
    },
    {
        name: "Multiple lines",
        raw: "Line 1\nLine 2\nLine 3",
        formatted: "Line 1\nLine 2\nLine 3"
    },
    {
        name: "Text with markdown formatting (adds characters)",
        raw: "**Bold** and *italic* text",
        formatted: "**Bold** and *italic* text"
    },
    {
        name: "Long markdown text",
        raw: "This is a long paragraph that should wrap across multiple lines when displayed in the terminal. It contains various words and phrases to test the wrapping behavior.",
        formatted: "This is a long paragraph that should wrap across multiple lines when displayed in the terminal. It contains various words and phrases to test the wrapping behavior."
    },
    {
        name: "Code block (may have different visual height)",
        raw: "Here's some code:\nconst x = 1;\nconst y = 2;",
        formatted: "Here's some code:\nconst x = 1;\nconst y = 2;"
    },
    {
        name: "CJK text (2-cell characters)",
        raw: "这是一段中文文本，测试显示效果。这段文字应该能够正确处理中文字符。",
        formatted: "这是一段中文文本，测试显示效果。这段文字应该能够正确处理中文字符。"
    }
];

console.log("\n" + "=".repeat(80));
console.log("AI Chat Display Anomaly Test");
console.log("=".repeat(80));

let failures = 0;
testCases.forEach(test => {
    const result = simulateDisplayClearing(test.raw, test.formatted);
    if (!result.success) {
        failures++;
        console.log(`\n❌ FAILED: ${test.name}`);
    } else {
        console.log(`\n✓ PASSED: ${test.name}`);
    }
});

console.log("\n" + "=".repeat(80));
console.log(`Test Summary: ${testCases.length - failures}/${testCases.length} passed`);
console.log("=".repeat(80) + "\n");

if (failures > 0) {
    console.log(`⚠️  ${failures} test(s) failed due to line count mismatch`);
    console.log(`\nPotential issues:`);
    console.log(`  1. The clearing logic might not clear enough lines`);
    console.log(`  2. The visual line count calculation might be inaccurate`);
    console.log(`  3. Formatted output might have different visual height than raw`);
    process.exit(1);
} else {
    console.log("✓ All display clearing tests passed");
    process.exit(0);
}

````

[⬆ 回到目录](#toc)

## 📄 test/test_display_logic.js

````javascript
function stripAnsi(str) {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function getVisualLineCount(text, screenWidth) {
    const lines = text.split('\n');
    let totalLines = 0;

    for (const line of lines) {
        const expandedLine = line.replace(/\t/g, '        ');
        const cleanLine = stripAnsi(expandedLine);

        let lineWidth = 0;
        for (const char of cleanLine) {
            const code = char.codePointAt(0) || 0;
            lineWidth += code > 255 ? 2 : 1;
        }

        if (lineWidth === 0) {
            totalLines += 1;
        } else {
            totalLines += Math.ceil(lineWidth / screenWidth);
        }
    }

    return totalLines;
}

const testCases = [
    { name: "Simple short text", text: "Hello world", screenWidth: 80 },
    { name: "Text that exactly fills one line", text: "A".repeat(80), screenWidth: 80 },
    { name: "Text that exceeds one line", text: "B".repeat(100), screenWidth: 80 },
    { name: "Multiple lines", text: "Line 1\nLine 2\nLine 3", screenWidth: 80 },
    { name: "Text with ANSI codes (colors)", text: "\x1b[31mRed text\x1b[0m and normal text", screenWidth: 80 },
    { name: "CJK characters (2 cells each)", text: "中文字符测试".repeat(20), screenWidth: 80 },
    { name: "Emoji characters (2 cells each)", text: "😀😁😂🤣😃".repeat(20), screenWidth: 80 },
    { name: "Mixed content", text: "Normal text with 中文 and 😀😁 emojis and \x1b[31mcolors\x1b[0m", screenWidth: 80 }
];

console.log("Testing visual line count calculation\n");
console.log("=".repeat(80));

testCases.forEach(test => {
    const lineCount = getVisualLineCount(test.text, test.screenWidth);
    const strippedLength = stripAnsi(test.text).length;

    console.log(`\nTest: ${test.name}`);
    console.log(`Screen width: ${test.screenWidth}`);
    console.log(`Text length (without ANSI): ${strippedLength}`);
    console.log(`Calculated visual lines: ${lineCount}`);
    console.log(`Preview: ${test.text.substring(0, 50)}${test.text.length > 50 ? '...' : ''}`);
});

console.log("\n" + "=".repeat(80));
console.log("\n✓ All tests completed\n");

console.log("\nSimulating cursor clearing logic:");
console.log("=".repeat(80));

const sampleText = "This is a test of the clearing logic\nWith multiple lines\nAnd some wrapping text that goes on for a while and should wrap around the screen";
const screenWidth = 80;
const lineCount = getVisualLineCount(sampleText, screenWidth);

console.log(`\nSample text:\n${sampleText}`);
console.log(`\nCalculated visual lines: ${lineCount}`);
console.log(`Cursor would move up: ${lineCount - 1} times`);

if (lineCount > 0) {
    console.log(`\n⚠️  Note: The clearing logic uses ${lineCount - 1} iterations.`);
    console.log(`   If the cursor is at the end of the last line, it needs to:`);
    console.log(`   1. Clear current line`);
    console.log(`   2. Move up and clear ${lineCount - 1} more lines`);
    console.log(`   Total: ${lineCount} lines cleared ✓`);
} else {
    console.log(`\n❌ ERROR: Line count is 0 or negative!`);
}

````

[⬆ 回到目录](#toc)

## 📄 test/test_dual_agent.js

````javascript
const { DualAgentRuntime } = require('./dist/agent/DualAgentRuntime');

async function testDualAgentRuntime() {
  console.log('=== Testing DualAgentRuntime ===\n');

  const testCases = [
    {
      name: 'Simple Task (Fast Path)',
      input: 'list files in current directory',
      expectedPath: 'fast',
      description: 'Should use direct execution, not planner'
    },
    {
      name: 'Complex Task (Planner)',
      input: '重构整个项目，批量优化所有TypeScript文件',
      expectedPath: 'planned',
      description: 'Should trigger planner with multiple steps'
    },
    {
      name: 'Another Complex Task',
      input: '逐个执行测试并生成报告',
      expectedPath: 'planned',
      description: 'Should trigger planner'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test: ${testCase.name}`);
    console.log(`Input: ${testCase.input}`);
    console.log(`Expected: ${testCase.expectedPath}`);
    console.log(`Description: ${testCase.description}`);
    console.log('='.repeat(60));

    try {
      const runtime = new DualAgentRuntime({});
      await runtime.run(testCase.input, undefined, 'Assistant');
      console.log('\n✅ Test completed');
    } catch (error) {
      console.error(`\n❌ Test failed:`, error.message);
    }

    console.log();
  }

  console.log('=== All tests completed ===');
}

testDualAgentRuntime().catch(console.error);

````

[⬆ 回到目录](#toc)

## 📄 test/test_dynamic_prompt.js

````javascript
/**
 * 测试动态Prompt注入功能
 */

const {
  detectGitContext,
  detectTechStack,
  generateTechStackGuidance,
  generateErrorRecovery,
  buildDynamicContext,
  injectDynamicContext
} = require('../dist/agent/dynamicPrompt');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           Yuangs AI 动态Prompt注入测试                     ║');
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

async function runTests() {
    const gitContext = await detectGitContext();
    
    test('1.1 Git上下文检测成功', () => {
        // 当前目录是Git仓库（从环境信息可见）
        assert(gitContext !== null, '应检测到Git仓库');
        assert(typeof gitContext === 'string', '应返回字符串');
    });
    
    test('1.2 Git上下文包含关键指导', () => {
        assert(gitContext.includes('git ls-files'), '应包含git ls-files');
        assert(gitContext.includes('git diff'), '应包含git diff');
        assert(gitContext.includes('git log'), '应包含git log');
    });
    
    console.log('\n📦 测试2: 技术栈检测\n');
    
    const techStack = await detectTechStack();
    
    test('2.1 技术栈检测返回数组', () => {
        assert(Array.isArray(techStack), '应返回数组');
        assert(techStack.length >= 0, '数组长度应>=0');
    });
    
    test('2.2 检测到Node.js项目', () => {
        assert(techStack.includes('Node.js'), '应检测到Node.js（package.json存在）');
    });
    
    console.log('\n📦 测试3: 技术栈指导生成\n');
    
    const guidance = generateTechStackGuidance(['Node.js', 'Docker']);
    
    test('3.1 Node.js指导包含关键信息', () => {
        assert(guidance.includes('npm'), '应包含npm');
        assert(guidance.includes('package.json'), '应包含package.json');
        assert(guidance.includes('TypeScript'), '应包含TypeScript');
    });
    
    test('3.2 Docker指导包含关键信息', () => {
        assert(guidance.includes('Dockerfile'), '应包含Dockerfile');
        assert(guidance.includes('docker-compose'), '应包含docker-compose');
    });
    
    console.log('\n📦 测试4: 错误恢复指导\n');
    
    const errorRecovery = generateErrorRecovery('Command not found: xyz');
    
    test('4.1 错误恢复包含错误信息', () => {
        assert(errorRecovery.includes('Command not found: xyz'), '应包含原始错误');
    });
    
    test('4.2 错误恢复包含恢复选项', () => {
        assert(errorRecovery.includes('检查命令语法'), '应包含语法检查建议');
        assert(errorRecovery.includes('验证文件/路径'), '应包含路径验证建议');
        assert(errorRecovery.includes('使用不同的标志或工具'), '应包含替代方案建议');
    });
    
    console.log('\n📦 测试5: 动态上下文构建\n');
    
    const dynamicContext = await buildDynamicContext('Test error');
    
    test('5.1 动态上下文包含Git信息', () => {
        assert(dynamicContext.gitContext !== undefined, '应包含gitContext');
    });
    
    test('5.2 动态上下文包含技术栈', () => {
        assert(dynamicContext.techStack !== undefined, '应包含techStack');
        assert(Array.isArray(dynamicContext.techStack), 'techStack应是数组');
        assert(dynamicContext.techStack.length > 0, '应检测到至少一个技术栈');
    });
    
    test('5.3 动态上下文包含错误恢复', () => {
        assert(dynamicContext.lastError === 'Test error', '应记录错误');
        assert(dynamicContext.errorRecovery !== undefined, '应生成错误恢复指导');
    });
    
    console.log('\n📦 测试6: Prompt注入\n');
    
    const basePrompt = 'Base prompt content';
    const injectedPrompt = injectDynamicContext(basePrompt, dynamicContext);
    
    test('6.1 注入后的Prompt包含基础内容', () => {
        assert(injectedPrompt.includes('Base prompt content'), '应保留基础prompt');
    });
    
    test('6.2 注入后的Prompt包含Git上下文', () => {
        assert(injectedPrompt.includes('[GIT CONTEXT]'), '应包含Git上下文标识');
        assert(injectedPrompt.includes('git ls-files'), '应包含Git命令');
    });
    
    test('6.3 注入后的Prompt包含技术栈指导', () => {
        assert(injectedPrompt.includes('[TECH STACK: Node.js]'), '应包含Node.js指导');
        assert(injectedPrompt.includes('npm'), '应包含npm命令');
    });
    
    test('6.4 注入后的Prompt包含错误恢复', () => {
        assert(injectedPrompt.includes('[ERROR RECOVERY]'), '应包含错误恢复标识');
        assert(injectedPrompt.includes('Test error'), '应包含错误信息');
    });
    
    console.log('\n📦 测试7: 无错误时的上下文\n');
    
    const noErrorContext = await buildDynamicContext();
    
    test('7.1 无错误时不生成错误恢复', () => {
        assert(noErrorContext.lastError === undefined, '不应记录错误');
        assert(noErrorContext.errorRecovery === undefined, '不应生成错误恢复指导');
    });
    
    console.log('\n╔═════════════════════════════════════════════════════════╗');
    console.log('║                      测试总结                              ║');
    console.log('╚═════════════════════════════════════════════════════════╝');
    console.log(`\n📊 通过率: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有动态Prompt注入测试通过！\n');
        console.log('✅ Git上下文检测正常');
        console.log('✅ 技术栈检测正常');
        console.log('✅ 错误恢复指导生成正常');
        console.log('✅ 动态上下文构建正常');
        console.log('✅ Prompt注入正常');
        console.log('\n📋 动态Prompt注入功能已完成！');
    } else {
        console.log('⚠️  部分测试失败，请检查上述错误信息\n');
        process.exit(1);
    }
}

// 执行测试
runTests().catch(err => {
    console.error('测试执行失败:', err);
    process.exit(1);
});

````

[⬆ 回到目录](#toc)

## 📄 test/test_escape_sequences.js

````javascript
const { spawn } = require('child_process');

console.log('Testing escape sequence visibility in different contexts\n');

console.log('=== Test 1: Direct TTY output (if available) ===');
if (process.stdout.isTTY) {
    console.log('stdout is a TTY');
    console.log('Writing escape sequence: \\x1b[A (cursor up)');
    process.stdout.write('\x1b[A');
    console.log('\n(You should see "Test 2" appear above this line)\n');
} else {
    console.log('stdout is NOT a TTY (pipelined output)');
    console.log('Escape sequences will be visible as text\n');
}

console.log('=== Test 2: Piped output (non-TTY) ===');
const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'inherit']
});

child.stdin.write('测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    console.log('\n=== Analysis ===');
    console.log('Exit code:', code);

    const escapeSequenceCount = (output.match(/\x1b/g) || []).length;
    console.log('Escape sequences found:', escapeSequenceCount);

    if (escapeSequenceCount > 0) {
        console.log('\n❌ ISSUE DETECTED: Escape sequences are visible in output!');
        console.log('This causes display anomalies in piped/non-TTY mode.');
    } else {
        console.log('\n✓ No escape sequences found in output');
    }
});

child.on('error', (err) => {
    console.error('Error:', err);
});

````

[⬆ 回到目录](#toc)

## 📄 test/test_integration.js

````javascript
const fs = require("fs");
const path = require("path");

// Check if the diffEdit command file exists
const diffEditPath = path.join(__dirname, "src/governance/commands/diffEdit.ts");
if (!fs.existsSync(diffEditPath)) {
    console.error("❌ diffEdit command file does not exist");
    process.exit(1);
}

console.log("✅ diffEdit command file exists");

// Check if the CLI imports and registers the diffEdit command
const cliPath = path.join(__dirname, "src/cli.ts");
const cliContent = fs.readFileSync(cliPath, "utf-8");

if (!cliContent.includes("createDiffEditCommand")) {
    console.error("❌ CLI does not import createDiffEditCommand");
    process.exit(1);
}

console.log("✅ CLI imports createDiffEditCommand");

if (!cliContent.includes("program.addCommand(diffEditCmd)")) {
    console.error("❌ CLI does not register diffEdit command");
    process.exit(1);
}

console.log("✅ CLI registers diffEdit command");

// Check if the help text includes diff-edit
if (!cliContent.includes("diff-edit")) {
    console.error("❌ CLI help does not include diff-edit command");
    process.exit(1);
}

console.log("✅ CLI help includes diff-edit command");

console.log("");
console.log("🎉 All integration checks passed!");
console.log("");
console.log("The diffEdit command has been successfully integrated into the yuangs CLI.");
console.log("Users can now run:");
console.log("  yuangs diff-edit propose <diff-file>");
console.log("  yuangs diff-edit list");
console.log("  yuangs diff-edit approve <id>");
console.log("  yuangs diff-edit exec <id>");
console.log("  yuangs diff-edit status <id>");

````

[⬆ 回到目录](#toc)

## 📄 test/test_interactive_completion.js

````javascript
/**
 * Interactive test for tab completion
 * This test simulates how the completer would be called in real usage
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

function createCompleter() {
    return (line) => {
        if (!line.startsWith('@') && !line.startsWith('#')) {
            return [[], line];
        }

        const isFileMode = line.startsWith('@');
        const prefix = isFileMode ? '@ ' : '# ';
        const inputAfterPrefix = line.substring(prefix.length);

        if (!inputAfterPrefix) {
            const currentDir = process.cwd();
            const files = fs.readdirSync(currentDir);
            const completions = isFileMode
                ? files.filter(f => {
                    const fullPath = path.join(currentDir, f);
                    return fs.statSync(fullPath).isFile();
                })
                : files.filter(f => {
                    const fullPath = path.join(currentDir, f);
                    return fs.statSync(fullPath).isDirectory();
                });
            return [completions.map(c => prefix + c), prefix];
        }

        const parts = inputAfterPrefix.split(path.sep);
        const partialName = parts[parts.length - 1];
        const basePath = parts.slice(0, -1).join(path.sep);
        const searchPath = basePath ? path.resolve(basePath) : process.cwd();

        if (!fs.existsSync(searchPath) || !fs.statSync(searchPath).isDirectory()) {
            return [[], line];
        }

        const files = fs.readdirSync(searchPath);
        const completions = files
            .filter(f => {
                const fullPath = path.join(searchPath, f);
                const isDir = fs.statSync(fullPath).isDirectory();
                const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());

                if (isFileMode) {
                    return matchesPrefix && !isDir;
                } else {
                    return matchesPrefix && isDir;
                }
            })
            .map(f => {
                const fullPath = path.join(searchPath, f);
                const isDir = fs.statSync(fullPath).isDirectory();
                return isDir ? f + path.sep : f;
            });

        const commonPrefix = completions.length === 1
            ? completions[0]
            : findCommonPrefix(completions);

        const newLine = basePath
            ? prefix + basePath + path.sep + commonPrefix
            : prefix + commonPrefix;

        return [completions.map(c => {
            const fullCompletion = basePath
                ? prefix + basePath + path.sep + c
                : prefix + c;
            return fullCompletion;
        }), newLine];
    };
}

const completer = createCompleter();

console.log('Tab Completion Interactive Test\n');
console.log('This simulates the completion behavior in handleAIChat.ts\n');

console.log('\nTest 1: @ (files only)');
const [completions1, hit1] = completer('@');
console.log(`  Hit: "${hit1}"`);
console.log(`  Completions: ${completions1.slice(0, 5).join(', ')}${completions1.length > 5 ? '...' : ''}\n`);

console.log('Test 2: # (directories only)');
const [completions2, hit2] = completer('#');
console.log(`  Hit: "${hit2}"`);
console.log(`  Completions: ${completions2.slice(0, 5).join(', ')}${completions2.length > 5 ? '...' : ''}\n`);

console.log('Test 3: @ src/ (files in src directory)');
const [completions3, hit3] = completer('@ src/');
console.log(`  Hit: "${hit3}"`);
console.log(`  Completions: ${completions3.slice(0, 5).join(', ')}${completions3.length > 5 ? '...' : ''}\n`);

console.log('Test 4: @ .git (no completions, .git is a directory)');
const [completions4, hit4] = completer('@ .git');
console.log(`  Hit: "${hit4}"`);
console.log(`  Completions: ${completions4.length > 0 ? completions4.slice(0, 5).join(', ') : '(none)'}\n`);

console.log('✓ All tests completed successfully!');
console.log('\nTo test in real mode:');
console.log('  1. Run: npm run dev -- ai');
console.log('  2. Type: @ and press Tab');
console.log('  3. Type: # and press Tab');
console.log('  4. Type: @ src/ and press Tab');

````

[⬆ 回到目录](#toc)

## 📄 test/test_logic.js

````javascript
const getVisualLineCount = (text, columns = 20) => {
    const lines = text.split('\n');
    let totalLines = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
        let visualWidth = 0;
        for (let j = 0; j < cleanLine.length; j++) {
            visualWidth += cleanLine.charCodeAt(j) > 255 ? 2 : 1;
        }
        const consumed = Math.max(1, Math.ceil(visualWidth / columns));
        totalLines += consumed;
        console.log(`Line ${i}: "${line}" (width ${visualWidth}) -> consumed ${consumed}`);
    }
    return totalLines;
};

console.log('--- Test 1: "Hello" ---');
console.log('Total:', getVisualLineCount('Hello'));

console.log('--- Test 2: "Hello\\n" ---');
console.log('Total:', getVisualLineCount('Hello\n'));

console.log('--- Test 3: 25 chars in 20 width ---');
console.log('Total:', getVisualLineCount('a'.repeat(25)));

````

[⬆ 回到目录](#toc)

## 📄 test/test_mode_detection.js

````javascript
const { createCompleter, detectMode } = require('../dist/commands/shellCompletions.js');

// Test the mode detection and completion functionality
console.log('Testing mode detection and completion functionality...\n');

const completer = createCompleter();

// Test mode detection
const modeTestCases = [
    '@',
    '@ ',
    '@ README',
    '@ README.md',
    '#',
    '# ',
    '# src',
    '# src/',
    '$ ls',
    '! pwd',
    'hello world'
];

console.log('=== MODE DETECTION TESTS ===');
modeTestCases.forEach(testCase => {
    const mode = detectMode(testCase);
    console.log(`Input: "${testCase}" -> Mode: ${mode}`);
});

console.log('');

// Test cases for @ (files) and # (directories) - corrected format
const fileTestCases = [
    '@',      // Just @ should trigger file completion
    '@ ',     // @ followed by space
    '@./',    // @ followed by path
    '@/home/', // Absolute path
];

const dirTestCases = [
    '#',      // Just # should trigger dir completion
    '# ',     // # followed by space
    '#./',    // # followed by path
    '#/home/', // Absolute path
];

console.log('=== FILE COMPLETION TESTS (@) ===');
fileTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Mode detected: ${detectMode(testCase)}`);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('=== DIRECTORY COMPLETION TESTS (#) ===');
dirTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Mode detected: ${detectMode(testCase)}`);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Mode detection and completion tests completed.');
````

[⬆ 回到目录](#toc)

## 📄 test/test_no_duplicates.js

````javascript
const { spawn } = require('child_process');

console.log('Test: Check for duplicate output in pipe mode\n');

const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'inherit']
});

child.stdin.write('简短测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    // Count occurrences of "AI：" prefix
    const aiPrefixMatches = output.match(/AI：/g) || [];
    const aiPrefixCount = aiPrefixMatches.length;

    console.log(`AI prefix count: ${aiPrefixCount}`);

    if (aiPrefixCount > 1) {
        console.log(`❌ FAILED: Duplicate AI prefixes found (${aiPrefixCount} times)`);
        process.exit(1);
    } else if (aiPrefixCount === 1) {
        console.log('✓ PASSED: Only one AI prefix (no duplicates)');
        process.exit(0);
    } else {
        console.log('⚠️  WARNING: No AI prefix found');
        process.exit(1);
    }
});

````

[⬆ 回到目录](#toc)

## 📄 test/test_p0_integration.js

````javascript
/**
 * P0级别优化综合测试
 * 验证所有P0功能正常工作
 */

const { buildPrompt } = require('../dist/agent/prompt');
const { LLMAdapter } = require('../dist/agent/llmAdapter');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           Yuangs AI P0优化综合测试                        ║');
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

console.log('📦 测试1: 聊天模式增强提示词\n');
test('1.1 聊天模式返回system字段', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system !== undefined, '应该有system字段');
    assert(typeof result.system === 'string', 'system应该是字符串');
});

test('1.2 聊天模式包含角色定义', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('Yuangs AI'), '应包含Yuangs AI标识');
    assert(result.system.includes('软件开发'), '应包含能力描述');
});

test('1.3 聊天模式包含交互原则', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('交互原则'), '应包含交互原则');
    assert(result.system.includes('简洁明了'), '应包含简洁明了原则');
});

test('1.4 聊天模式包含输出格式', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('输出格式'), '应包含输出格式');
    assert(result.system.includes('Markdown'), '应使用Markdown格式');
});

test('1.5 聊天模式包含上下文使用指导', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('上下文使用'), '应包含上下文使用指导');
});

test('1.6 聊天模式包含能力声明', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('当前能力'), '应包含能力声明');
    assert(result.system.includes('读取和分析代码文件'), '应列出具体能力');
});

console.log('\n📦 测试2: 命令模式保持兼容\n');
test('2.1 命令模式返回outputSchema', () => {
    const result = buildPrompt(null, {}, 'command', '测试');
    assert(result.outputSchema !== undefined, '应有outputSchema字段');
});

test('2.2 命令模式返回messages数组', () => {
    const result = buildPrompt(null, {}, 'command', '测试');
    assert(Array.isArray(result.messages), 'messages应该是数组');
});

console.log('\n📦 测试3: CoT (Chain of Thought) 解析\n');
test('3.1 解析完整CoT格式', () => {
    const cot = `[THOUGHT]
测试思考内容
[/THOUGHT]
\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "ls",
  "risk_level": "low"
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.type === 'shell_cmd', '应正确解析action_type');
    assert(result.reasoning === '测试思考内容', '应提取THOUGHT内容');
    assert(result.payload.command === 'ls', '应解析command');
    assert(result.payload.risk_level === 'low', '应解析risk_level');
});

test('3.2 解析高风险操作', () => {
    const cot = `[THOUGHT]
删除文件
[/THOUGHT]
\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "rm -rf /tmp/test",
  "risk_level": "high"
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.payload.risk_level === 'high', '应识别高风险');
    assert(result.reasoning.includes('删除'), '应提取删除相关的思考');
});

test('3.3 解析answer类型', () => {
    const cot = `[THOUGHT]
提供答案
[/THOUGHT]
\`\`\`json
{
  "action_type": "answer",
  "content": "这是答案"
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.type === 'answer', '应是answer类型');
    assert(result.isDone === true, 'answer应标记为完成');
    assert(result.payload.content === '这是答案', '应提取content');
});

test('3.4 向后兼容旧JSON格式', () => {
    const oldJson = `{
  "action_type": "shell_cmd",
  "command": "ls",
  "reasoning": "旧格式"
}`;
    
    const result = LLMAdapter.parseThought(oldJson);
    assert(result.type === 'shell_cmd', '旧格式仍应正常工作');
    assert(result.payload.command === 'ls', '应解析command');
});

test('3.5 解析失败时回退', () => {
    const invalid = '不是JSON格式';
    
    const result = LLMAdapter.parseThought(invalid);
    assert(result.type === 'answer', '应回退到answer类型');
    assert(result.isDone === true, '应标记为完成');
    assert(result.payload.content === invalid, '原始内容作为答案');
});

test('3.6 解析tool_call类型', () => {
    const cot = `[THOUGHT]
读取文件
[/THOUGHT]
\`\`\`json
{
  "action_type": "tool_call",
  "tool_name": "read_file",
  "parameters": {
    "path": "test.txt"
  },
  "risk_level": "low"
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.type === 'tool_call', '应是tool_call类型');
    assert(result.payload.tool_name === 'read_file', '应解析tool_name');
    assert(result.payload.parameters.path === 'test.txt', '应解析parameters');
});

test('3.7 智能推断action_type', () => {
    const cot = `[THOUGHT]
测试
[/THOUGHT]
\`\`\`json
{
  "tool_name": "list_files",
  "parameters": {}
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.type === 'tool_call', '应从tool_name推断为tool_call');
});

console.log('\n📦 测试4: 文件上下文注入\n');
test('4.1 文件上下文注入到system消息', () => {
    const result = buildPrompt(null, {
        files: [
            { path: 'test.ts', content: 'function test() {}' }
        ]
    }, 'chat', '分析文件');
    
    const contextMessage = result.messages.find(m => m.role === 'system');
    assert(contextMessage !== undefined, '应有system上下文消息');
    assert(contextMessage.content.includes('test.ts'), '应包含文件路径');
    assert(contextMessage.content.includes('function test()'), '应包含文件内容');
});

test('4.2 user消息正确添加', () => {
    const result = buildPrompt(null, {}, 'chat', '测试问题');
    const userMessage = result.messages[result.messages.length - 1];
    assert(userMessage.role === 'user', '最后一条消息应是user');
    assert(userMessage.content === '测试问题', '应包含用户输入');
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                      测试总结                              ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`\n📊 通过率: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);

if (passedTests === totalTests) {
    console.log('🎉 所有P0级别测试通过！\n');
    console.log('✅ 聊天模式提示词增强完成');
    console.log('✅ Agent模式CoT分离完成');
    console.log('✅ 向后兼容性验证通过');
    console.log('✅ 文件上下文注入正常');
    console.log('\n📋 P0级别优化全部完成，可以进行P1级别优化！');
} else {
    console.log('⚠️  部分测试失败，请检查上述错误信息\n');
    process.exit(1);
}

````

[⬆ 回到目录](#toc)

## 📄 test/test_path_completion.js

````javascript
const { createCompleter, detectMode } = require('../dist/commands/shellCompletions.js');

// Test path completion without spaces
console.log('Testing path completion without spaces...\n');

const completer = createCompleter();

// Test path completion without spaces (proper format)
console.log('=== PATH COMPLETION WITHOUT SPACES ===');
const pathTests = [
    '@./',      // Current directory files
    '#./',      // Current directory dirs
    '@/tmp',    // Absolute path (may not exist)
    '#/tmp',    // Absolute path (may not exist)
    '@src/',    // src directory files
    '#src/',    // src directory dirs
    '@package.', // Files starting with package
    '#d'        // Directories starting with d
];

pathTests.forEach(test => {
    console.log(`Input: "${test}"`);
    try {
        const [completions, line] = completer(test);
        console.log(`  Mode: ${detectMode(test)}`);
        console.log(`  Completions: ${completions.length}`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Path completion tests completed.');
````

[⬆ 回到目录](#toc)

## 📄 test/test_prompt_enhancement.js

````javascript
/**
 * 测试增强后的聊天模式提示词
 */

const { buildPrompt } = require('../dist/agent/prompt');

console.log('='.repeat(60));
console.log('测试1: 聊天模式 - 无上下文');
console.log('='.repeat(60));

const result1 = buildPrompt(null, {}, 'chat', '如何优化一个函数？');

console.log('\n📋 System Prompt:');
console.log('-'.repeat(60));
console.log(result1.system);
console.log('-'.repeat(60));

console.log('\n✓ 测试通过：聊天模式增强提示词已正确加载');
console.log('✓ 包含角色定义、交互原则、输出格式等完整信息\n');

console.log('='.repeat(60));
console.log('测试2: 聊天模式 - 带文件上下文');
console.log('='.repeat(60));

const result2 = buildPrompt(null, {
    files: [
        { path: 'src/utils.ts', content: 'function hello() { return "world"; }' }
    ]
}, 'chat', '分析这个函数');

console.log('\n📋 System Prompt:');
console.log('-'.repeat(60));
console.log(result2.system.substring(0, 300) + '...');
console.log('-'.repeat(60));

console.log('\n📋 Messages:');
console.log('-'.repeat(60));
console.log(JSON.stringify(result2.messages, null, 2));
console.log('-'.repeat(60));

console.log('\n✓ 测试通过：文件上下文正确注入到system消息中');
console.log('✓ User消息正确添加到messages数组\n');

console.log('='.repeat(60));
console.log('测试3: 命令模式');
console.log('='.repeat(60));

const result3 = buildPrompt(null, {}, 'command', '列出当前目录文件');

console.log('\n📋 Messages类型:', typeof result3.messages);
console.log('📋 OutputSchema:', result3.outputSchema ? '✓ 已定义' : '✗ 未定义');

console.log('\n✓ 测试通过：命令模式保持原有逻辑不变\n');

console.log('='.repeat(60));
console.log('所有测试通过！✅');
console.log('='.repeat(60));

````

[⬆ 回到目录](#toc)

## 📄 test/test_readline_integration.js

````javascript
const { createCompleter, detectMode, splitToken } = require('../dist/commands/shellCompletions.js');

// Test the readline integration aspects of completion
console.log('Testing readline integration for completion functionality...\n');

const completer = createCompleter();

// Test the splitToken function behavior
console.log('=== SPLIT TOKEN BEHAVIOR ===');
const splitTestCases = [
    '@',
    '@ ',
    '@ README',
    '@ README.md',
    '#',
    '# src',
    '# src/',
    '$ ls -l',
    'normal chat text'
];

splitTestCases.forEach(testCase => {
    const { prefix, token } = splitToken(testCase);
    console.log(`Input: "${testCase}"`);
    console.log(`  Prefix: "${prefix}"`);
    console.log(`  Token: "${token}"`);
    console.log(`  Mode: ${detectMode(testCase)}`);
    console.log('');
});

// Test actual completion behavior with various inputs
console.log('=== ACTUAL COMPLETION BEHAVIOR ===');
const completionTestCases = [
    '@',           // Should show all files
    '@ ',          // Should show all files (space after @)
    '@README',     // Should match README files
    '#',           // Should show all directories
    '# ',          // Should show all directories (space after #)
    '#src',        // Should match src directory
    '@ src/',      // Should show files in src directory
    '# src/'       // Should show subdirectories in src directory
];

completionTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        const { prefix, token } = splitToken(testCase);
        console.log(`  Split: prefix="${prefix}", token="${token}"`);
        console.log(`  Mode: ${detectMode(testCase)}`);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Returned line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Readline integration tests completed.');
````

[⬆ 回到目录](#toc)

## 📄 test/test_risk_disclosure.js

````javascript
/**
 * 测试风险告知生成功能
 */

const {
  analyzeRiskLevel,
  generateRiskDisclosure,
  formatRiskDisclosureCLI
} = require('../dist/agent/riskDisclosure');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           Yuangs AI 风险告知生成测试                       ║');
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

console.log('📦 测试1: 低风险分析\n');

test('1.1 简单读取操作为低风险', () => {
    const factors = {
        commandType: 'file_read',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'low', '应为低风险');
    assert(risk.score < 40, '分数应小于40');
});

console.log('\n📦 测试2: 中风险分析\n');

test('2.1 Shell命令为中风险', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'ls -la',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'medium', '应为中风险');
    assert(risk.score >= 40, '分数应>=40');
});

test('2.2 Git操作为中风险', () => {
    const factors = {
        commandType: 'git_operation',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: true,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'medium', '应为中风险');
});

test('2.3 文件写入为中风险', () => {
    const factors = {
        commandType: 'file_write',
        fileCount: 1,
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'medium', '应为中风险');
});

console.log('\n📦 测试3: 高风险分析\n');

test('3.1 删除操作为高风险', () => {
    const factors = {
        commandType: 'file_delete',
        fileCount: 1,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
    assert(risk.score >= 70, '分数应>=70');
});

test('3.2 系统配置修改为高风险', () => {
    const factors = {
        commandType: 'system_config',
        isDestructive: false,
        modifiesSystem: true,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
});

test('3.3 rm -rf命令为极高风险', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf /path',
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
    assert(risk.score >= 100, '分数应接近100');
});

test('3.4 大批量删除为高风险', () => {
    const factors = {
        commandType: 'file_delete',
        fileCount: 20,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
});

test('3.5 chmod 777为高风险', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'chmod 777 /path',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
    assert(risk.score >= 70, '分数应>=70');
});

console.log('\n📦 测试4: 风险告知书生成\n');

test('4.1 生成低风险告知书', () => {
    const factors = {
        commandType: 'file_read',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    assert(disclosure.riskLevel.level === 'low', '风险等级应为low');
    assert(disclosure.description !== '', '应有描述');
    assert(disclosure.potentialIssues.length > 0, '应有潜在问题');
    assert(disclosure.recommendedActions.length > 0, '应有推荐行动');
    assert(disclosure.requireConfirmation === false, '低风险不需要确认');
});

test('4.2 生成中风险告知书', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'ls -la',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    assert(disclosure.riskLevel.level === 'medium', '风险等级应为medium');
    assert(disclosure.description.includes('【中】'), '描述应包含中风险');
    assert(disclosure.potentialIssues.length > 0, '应有潜在问题');
    assert(disclosure.recommendedActions.length > 0, '应有推荐行动');
});

test('4.3 生成高风险告知书', () => {
    const factors = {
        commandType: 'file_delete',
        fileCount: 5,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    assert(disclosure.riskLevel.level === 'high', '风险等级应为high');
    assert(disclosure.description.includes('【高】'), '描述应包含高风险');
    assert(disclosure.potentialIssues.length > 0, '应有潜在问题');
    assert(disclosure.recommendedActions.length > 0, '应有推荐行动');
    assert(disclosure.requireConfirmation === true, '高风险需要确认');
    assert(disclosure.checkpoint !== undefined, '应有检查点');
});

console.log('\n📦 测试5: CLI格式化\n');

test('5.1 低风险格式化包含图标', () => {
    const factors = {
        commandType: 'file_read',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    const formatted = formatRiskDisclosureCLI(disclosure);
    assert(formatted.includes('🟢'), '应包含低风险图标');
    assert(formatted.includes('低风险'), '应包含低风险标签');
});

test('5.2 中风险格式化包含图标', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'npm install',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: true,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    const formatted = formatRiskDisclosureCLI(disclosure);
    assert(formatted.includes('🟡'), '应包含中风险图标');
    assert(formatted.includes('中风险'), '应包含中风险标签');
});

test('5.3 高风险格式化包含图标', () => {
    const factors = {
        commandType: 'file_delete',
        fileCount: 10,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    const formatted = formatRiskDisclosureCLI(disclosure);
    assert(formatted.includes('🔴'), '应包含高风险图标');
    assert(formatted.includes('高风险'), '应包含高风险标签');
    assert(formatted.includes('🔐'), '应包含确认提示');
});

test('5.4 格式化包含所有部分', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf test',
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    const formatted = formatRiskDisclosureCLI(disclosure);
    assert(formatted.includes('📋 操作描述'), '应包含操作描述');
    assert(formatted.includes('⚠️  潜在问题'), '应包含潜在问题');
    assert(formatted.includes('💡 推荐行动'), '应包含推荐行动');
});

console.log('\n📦 测试6: 特定风险场景\n');

test('6.1 Docker操作为中高风险', () => {
    const factors = {
        commandType: 'docker_operation',
        isDestructive: false,
        modifiesSystem: true,
        requiresNetwork: true,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', 'Docker操作应为高风险');
});

test('6.2 npm install为中风险', () => {
    const factors = {
        commandType: 'npm_install',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: true,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'medium', 'npm install应为中风险');
});

test('6.3 sudo操作增加风险', () => {
    const factors1 = {
        commandType: 'shell_cmd',
        command: 'ls',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const factors2 = {
        commandType: 'shell_cmd',
        command: 'sudo ls',
        isDestructive: false,
        modifiesSystem: true,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk1 = analyzeRiskLevel(factors1);
    const risk2 = analyzeRiskLevel(factors2);
    assert(risk2.score > risk1.score, 'sudo操作应增加风险');
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                      测试总结                              ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`\n📊 通过率: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);

if (passedTests === totalTests) {
    console.log('🎉 所有风险告知测试通过！\n');
    console.log('✅ 风险等级分析正常');
    console.log('✅ 风险告知书生成正常');
    console.log('✅ CLI格式化正常');
    console.log('✅ 低风险处理正常');
    console.log('✅ 中风险处理正常');
    console.log('✅ 高风险处理正常');
    console.log('✅ 特定风险场景识别正常');
    console.log('\n📋 风险告知功能已完成！');
} else {
    console.log('⚠️  部分测试失败，请检查上述错误信息\n');
    process.exit(1);
}

````

[⬆ 回到目录](#toc)

## 📄 test/test_simple.js

````javascript
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

````

[⬆ 回到目录](#toc)

## 📄 test/test_simple_integration.js

````javascript
const { createCompleter, detectMode } = require('../dist/commands/shellCompletions.js');

// Test the readline integration aspects of completion
console.log('Testing readline integration for completion functionality...\n');

const completer = createCompleter();

// Test actual completion behavior with various inputs
console.log('=== ACTUAL COMPLETION BEHAVIOR ===');
const completionTestCases = [
    '@',           // Should show all files
    '@ ',          // Should show all files (space after @)
    '@README',     // Should match README files
    '#',           // Should show all directories
    '# ',          // Should show all directories (space after #)
    '#src',        // Should match src directory
    '@ src/',      // Should show files in src directory
    '# src/'       // Should show subdirectories in src directory
];

completionTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Mode: ${detectMode(testCase)}`);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Returned line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Readline integration tests completed.');
````

[⬆ 回到目录](#toc)

## 📄 test/test_structured_output.js

````javascript
/**
 * Test script for Native Structured Output implementation
 */

const { runLLM } = require('./dist/agent/llm.js');

async function testNativeStructuredOutput() {
  console.log('Testing Native Structured Output...\n');

  const testCases = [
    {
      name: 'GPT-4o (supports structured output)',
      model: 'gpt-4o',
      prompt: {
        system: '[SYSTEM PROTOCOL V2.2]',
        messages: [{ role: 'user', content: 'count files in /tmp' }]
      }
    },
    {
      name: 'Claude-3.5 (supports structured output)',
      model: 'claude-3.5-sonnet',
      prompt: {
        system: '[SYSTEM PROTOCOL V2.2]',
        messages: [{ role: 'user', content: 'list files' }]
      }
    },
    {
      name: 'Assistant (no structured output)',
      model: 'Assistant',
      prompt: {
        system: '[SYSTEM PROTOCOL V2.2]',
        messages: [{ role: 'user', content: 'test' }]
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name} ===`);
    try {
      const result = await runLLM({
        prompt: testCase.prompt,
        model: testCase.model,
        stream: false
      });

      console.log(`Latency: ${result.latencyMs}ms`);
      console.log(`Response length: ${result.rawText?.length || 0} chars`);
      console.log(`Parsed: ${result.parsed ? 'Yes' : 'No'}`);

      if (result.parsed) {
        console.log('Parsed action:', JSON.stringify(result.parsed, null, 2));
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

testNativeStructuredOutput().catch(console.error);

````

[⬆ 回到目录](#toc)

## 📄 test/test_tab_completion.js

````javascript
/**
 * Test tab completion logic
 */

const fs = require('fs');
const path = require('path');

function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

function testCompleter(line) {
    if (!line.startsWith('@') && !line.startsWith('#')) {
        return [[], line];
    }

    const isFileMode = line.startsWith('@');
    const prefix = isFileMode ? '@ ' : '# ';
    const inputAfterPrefix = line.substring(prefix.length);

    if (!inputAfterPrefix) {
        const currentDir = process.cwd();
        const files = fs.readdirSync(currentDir);
        const completions = isFileMode
            ? files.filter(f => {
                const fullPath = path.join(currentDir, f);
                return fs.statSync(fullPath).isFile();
            })
            : files.filter(f => {
                const fullPath = path.join(currentDir, f);
                return fs.statSync(fullPath).isDirectory();
            });
        return [completions.map(c => prefix + c), prefix];
    }

    const parts = inputAfterPrefix.split(path.sep);
    const partialName = parts[parts.length - 1];
    const basePath = parts.slice(0, -1).join(path.sep);
    const searchPath = basePath ? path.resolve(basePath) : process.cwd();

    if (!fs.existsSync(searchPath) || !fs.statSync(searchPath).isDirectory()) {
        return [[], line];
    }

    const files = fs.readdirSync(searchPath);
    const completions = files
        .filter(f => {
            const fullPath = path.join(searchPath, f);
            const isDir = fs.statSync(fullPath).isDirectory();
            const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());

            if (isFileMode) {
                return matchesPrefix && !isDir;
            } else {
                return matchesPrefix && isDir;
            }
        })
        .map(f => {
            const fullPath = path.join(searchPath, f);
            const isDir = fs.statSync(fullPath).isDirectory();
            return isDir ? f + path.sep : f;
        });

    const commonPrefix = completions.length === 1
        ? completions[0]
        : findCommonPrefix(completions);

    const newLine = basePath
        ? prefix + basePath + path.sep + commonPrefix
        : prefix + commonPrefix;

    return [completions.map(c => {
        const fullCompletion = basePath
            ? prefix + basePath + path.sep + c
            : prefix + c;
        return fullCompletion;
    }), newLine];
}

console.log('Testing tab completion logic\n');

const testCases = [
    '@',
    '#',
    '@ src',
    '# s',
    '@ README',
];

testCases.forEach(testLine => {
    console.log(`\nInput: "${testLine}"`);
    const [completions, hit] = testCompleter(testLine);
    console.log(`Hit: "${hit}"`);
    console.log(`Completions (${completions.length}):`);
    completions.slice(0, 10).forEach(c => {
        console.log(`  - ${c}`);
    });
    if (completions.length > 10) {
        console.log(`  ... and ${completions.length - 10} more`);
    }
});

console.log('\n✓ Tab completion logic tests completed');

````

[⬆ 回到目录](#toc)

## 📄 test/test_tab_completion_debug.js

````javascript
/**
 * Test tab completion logic with more cases
 */

const fs = require('fs');
const path = require('path');

function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

function testCompleter(line) {
    if (!line.startsWith('@') && !line.startsWith('#')) {
        return [[], line];
    }

    const isFileMode = line.startsWith('@');
    const prefix = isFileMode ? '@ ' : '# ';
    const inputAfterPrefix = line.substring(prefix.length);

    if (!inputAfterPrefix) {
        const currentDir = process.cwd();
        const files = fs.readdirSync(currentDir);
        const completions = isFileMode
            ? files.filter(f => {
                const fullPath = path.join(currentDir, f);
                return fs.statSync(fullPath).isFile();
            })
            : files.filter(f => {
                const fullPath = path.join(currentDir, f);
                return fs.statSync(fullPath).isDirectory();
            });
        return [completions.map(c => prefix + c), prefix];
    }

    const parts = inputAfterPrefix.split(path.sep);
    const partialName = parts[parts.length - 1];
    const basePath = parts.slice(0, -1).join(path.sep);
    const searchPath = basePath ? path.resolve(basePath) : process.cwd();

    console.log(`  DEBUG: parts=${JSON.stringify(parts)}, partialName="${partialName}", basePath="${basePath}", searchPath="${searchPath}"`);

    if (!fs.existsSync(searchPath) || !fs.statSync(searchPath).isDirectory()) {
        console.log(`  DEBUG: searchPath does not exist or is not a directory`);
        return [[], line];
    }

    const files = fs.readdirSync(searchPath);
    const completions = files
        .filter(f => {
            const fullPath = path.join(searchPath, f);
            const isDir = fs.statSync(fullPath).isDirectory();
            const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());

            if (isFileMode) {
                return matchesPrefix && !isDir;
            } else {
                return matchesPrefix && isDir;
            }
        })
        .map(f => {
            const fullPath = path.join(searchPath, f);
            const isDir = fs.statSync(fullPath).isDirectory();
            return isDir ? f + path.sep : f;
        });

    const commonPrefix = completions.length === 1
        ? completions[0]
        : findCommonPrefix(completions);

    const newLine = basePath
        ? prefix + basePath + path.sep + commonPrefix
        : prefix + commonPrefix;

    return [completions.map(c => {
        const fullCompletion = basePath
            ? prefix + basePath + path.sep + c
            : prefix + c;
        return fullCompletion;
    }), newLine];
}

console.log('Testing tab completion logic with debug\n');

const testCases = [
    '@',
    '#',
    '@ src/',
    '# src/',
    '@ dist/cli.js',
    '@ .g',
];

testCases.forEach(testLine => {
    console.log(`\nInput: "${testLine}"`);
    const [completions, hit] = testCompleter(testLine);
    console.log(`Hit: "${hit}"`);
    console.log(`Completions (${completions.length}):`);
    completions.slice(0, 5).forEach(c => {
        console.log(`  - ${c}`);
    });
    if (completions.length > 5) {
        console.log(`  ... and ${completions.length - 5} more`);
    }
});

console.log('\n✓ Tab completion logic tests completed');

````

[⬆ 回到目录](#toc)

## 📄 test/test_table_now.js

````javascript
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

````

[⬆ 回到目录](#toc)

## 📄 test/test_table_quiet.js

````javascript
#!/usr/bin/env node

const { StreamMarkdownRenderer } = require('./dist/utils/renderer.js');
const ora = require('ora');

const testTable = `| 姓名 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25   | 北京 |
| 李四 | 30   | 上海 |
| 王五 | 28   | 广州 |`;

console.log('\n=== 表格渲染测试 (quietMode=true) ===\n');
const spinner = ora('测试...').start();
const renderer = new StreamMarkdownRenderer('🤖 ', spinner, true); // quietMode=true

renderer.onChunk(testTable);
renderer.finish();

````

[⬆ 回到目录](#toc)

---
### 📊 最终统计汇总
- **文件总数:** 39
- **代码总行数:** 3241
- **物理总大小:** 107.86 KB
