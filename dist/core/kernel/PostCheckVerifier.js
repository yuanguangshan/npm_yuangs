"use strict";
/**
 * Post-Check Verifier for Atomic Transactions
 *
 * 后验证检查器 - 确保代码修改后的工程质量
 *
 * 核心功能：
 * 1. 执行 TypeScript 类型检查
 * 2. 运行自定义验证命令
 * 3. 捕获并结构化错误信息
 * 4. 为 AI 提供可修复的反馈
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostCheckVerifier = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * 后验证检查器
 *
 * 执行编译检查和自定义验证，确保代码修改不会破坏项目
 */
class PostCheckVerifier {
    config;
    constructor(config) {
        this.config = {
            typeCheckCommand: 'npx tsc --noEmit',
            cwd: process.cwd(),
            timeout: 60000,
            ...config
        };
    }
    /**
     * 执行类型检查
     *
     * @returns 验证结果
     */
    async verifyTypeCheck() {
        return this.runCheck(this.config.typeCheckCommand, 'Type Check');
    }
    /**
     * 执行自定义验证
     *
     * @returns 验证结果
     */
    async verifyCustomCheck() {
        if (!this.config.customCheckCommand) {
            return {
                passed: true,
                duration: 0
            };
        }
        return this.runCheck(this.config.customCheckCommand, 'Custom Check');
    }
    /**
     * 执行所有验证
     *
     * @returns 验证结果（任何一项失败即整体失败）
     */
    async verifyAll() {
        const typeCheckResult = await this.verifyTypeCheck();
        if (!typeCheckResult.passed) {
            return {
                ...typeCheckResult,
                error: `Type check failed:\n${typeCheckResult.error}`
            };
        }
        const customCheckResult = await this.verifyCustomCheck();
        if (!customCheckResult.passed) {
            return {
                ...customCheckResult,
                error: `Custom check failed:\n${customCheckResult.error}`
            };
        }
        return {
            passed: true,
            duration: typeCheckResult.duration + customCheckResult.duration
        };
    }
    /**
     * 运行单个检查命令
     */
    async runCheck(command, checkName) {
        const startTime = Date.now();
        try {
            console.log(`\n[Verifier] 🛡️ Executing ${checkName}: ${command}...`);
            const { stdout, stderr } = await execAsync(command, {
                cwd: this.config.cwd,
                timeout: this.config.timeout,
                encoding: 'utf-8'
            });
            const duration = Date.now() - startTime;
            return {
                passed: true,
                stdout,
                stderr,
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            let errorMessage = '';
            if (error.stdout) {
                errorMessage += error.stdout;
            }
            if (error.stderr) {
                if (errorMessage)
                    errorMessage += '\n';
                errorMessage += error.stderr;
            }
            if (error.killed && error.signal === 'SIGTERM') {
                errorMessage += '\nCommand timed out';
            }
            if (!errorMessage) {
                errorMessage = error.message || 'Unknown error';
            }
            return {
                passed: false,
                stdout: error.stdout,
                stderr: error.stderr,
                error: errorMessage,
                duration
            };
        }
    }
    /**
     * 格式化错误信息，便于 AI 理解
     */
    formatErrorForAI(result) {
        if (result.passed) {
            return '✅ Verification passed: All checks successful.';
        }
        let formatted = '❌ Verification failed. Please fix the following errors:\n\n';
        if (result.error) {
            const errorLines = result.error.split('\n');
            const relevantLines = errorLines.filter(line => {
                return line.includes('error TS') ||
                    line.includes('error ') ||
                    line.includes('Error:');
            });
            if (relevantLines.length > 0) {
                formatted += '=== Type Errors ===\n';
                formatted += relevantLines.slice(0, 50).join('\n');
                if (relevantLines.length > 50) {
                    formatted += `\n... and ${relevantLines.length - 50} more errors`;
                }
                formatted += '\n\n';
            }
            else {
                formatted += `=== Error Details ===\n${result.error.slice(0, 2000)}\n\n`;
            }
        }
        return formatted;
    }
    /**
     * 提取文件路径和行号（用于定位错误）
     */
    extractErrorLocations(result) {
        if (result.passed || !result.error) {
            return [];
        }
        const locations = [];
        const errorPattern = /([^(:]+)\((\d+),\d+\): (error TS\d+: .+)/g;
        let match;
        while ((match = errorPattern.exec(result.error)) !== null) {
            locations.push({
                file: match[1],
                line: parseInt(match[2], 10),
                message: match[3]
            });
        }
        return locations;
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
exports.PostCheckVerifier = PostCheckVerifier;
//# sourceMappingURL=PostCheckVerifier.js.map