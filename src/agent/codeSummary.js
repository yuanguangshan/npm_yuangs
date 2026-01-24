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
