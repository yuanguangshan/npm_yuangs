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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirm = confirm;
const readline = __importStar(require("node:readline/promises"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * 向用户请求确认。
 *
 * 三种模式：
 *  1. YUANGS_NO_CONFIRM=1 环境变量 → 自动放行（CI/CD、自动化脚本）
 *  2. 非 TTY（stdin 管道/重定向）→ 自动放行 + 警告
 *  3. 交互式 TTY → readline 提示 y/N
 */
async function confirm(message) {
    // 模式 1：环境变量强制跳过确认
    if (process.env.YUANGS_NO_CONFIRM === '1' || process.env.YUANGS_NO_CONFIRM === 'true') {
        console.log(chalk_1.default.gray(`⚠️  ${message} → 自动确认 (YUANGS_NO_CONFIRM=1)`));
        return true;
    }
    // 模式 2：非交互式环境（无 TTY），自动放行避免挂起
    if (!process.stdin.isTTY) {
        console.log(chalk_1.default.gray(`⚠️  ${message} → 自动确认 (非交互模式, 无 TTY)`));
        return true;
    }
    // 模式 3：交互式终端，正常提示
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false, // 禁用终端特性以避免与外部 readline 接口冲突
    });
    try {
        const answer = await rl.question(chalk_1.default.yellow(`\n⚠️  ${message} (y/N) `));
        return answer.toLowerCase() === 'y';
    }
    finally {
        rl.close();
    }
}
//# sourceMappingURL=confirm.js.map