import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { GitService } from '../../core/git/GitService';
import { CodeReviewer, ReviewLevel, IssueSeverity } from '../../core/git/CodeReviewer';
import { getRouter } from '../../core/modelRouter';
import { SecurityScanner, SecurityIssueType } from '../../core/security/SecurityScanner';
import fs from 'fs';
import path from 'path';

export function registerReviewCommand(gitCmd: Command) {
    // git review - AI 代码审查
    gitCmd
        .command('review')
        .description('AI 代码审查')
        .option('-l, --level <level>', '审查级别 (quick/standard/deep)', 'standard')
        .option('-f, --file <file>', '审查特定文件')
        .option('--unstaged', '审查未暂存的变更')
        .option('--no-ai', '禁用 AI (将显示变更摘要)')
        .option('--no-save', '不保存审查结果到 git_reviews.md')
        .action(async (options) => {
            if (options.ai === false) {
                const gitService = new GitService();
                const diff = await gitService.getDiff();
                const files = options.unstaged ? diff.files.unstaged : diff.files.staged;

                console.log(chalk.yellow('\nℹ️  AI 代码审查已禁用。'));
                console.log(chalk.white(`本次涉及变更文件数: ${files.length} 个`));
                console.log(chalk.gray('💡 建议使用 "git diff" 或 IDE 插件进行人工审查。'));
                return;
            }

            const spinner = ora('初始化代码审查...').start();

            try {
                const gitService = new GitService();

                if (!(await gitService.isGitRepository())) {
                    spinner.fail('当前目录不是 Git 仓库');
                    return;
                }

                const securityScanner = new SecurityScanner();
                const diff = await gitService.getDiff();
                const files = options.unstaged ? diff.files.unstaged : diff.files.staged;

                spinner.text = '执行安全扫描...';
                const repoRoot = await gitService.getRepoRoot();
                const filesToScan = new Map<string, string>();

                for (const file of files) {
                    const filePath = path.join(repoRoot, file);
                    try {
                        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                            const content = fs.readFileSync(filePath, 'utf8');
                            const scanResult = securityScanner.scanAndRedact(content, file);
                            
                            if (scanResult.issues.length > 0) {
                                filesToScan.set(file, content);
                                spinner.warn(`发现 ${scanResult.issues.length} 个安全问题在 ${file}`);
                                for (const issue of scanResult.issues) {
                                    console.log(chalk.red(`  ${issue.type}: ${issue.description} (line ${issue.line})`));
                                }
                            }
                        }
                    } catch (error: any) {
                        console.warn(`Warning: 无法读取文件 ${file}: ${error.message}`);
                    }
                }

                if (filesToScan.size > 0) {
                    spinner.warn('安全扫描发现敏感信息');
                    console.log(chalk.yellow('\n⚠️  警告：检测到可能的敏感信息！'));
                    console.log(chalk.yellow('建议：'));
                    console.log(chalk.yellow('  • 移除硬编码的密钥、密码、令牌等敏感信息'));
                    console.log(chalk.yellow('  • 使用环境变量或配置文件管理敏感数据'));
                    console.log(chalk.yellow('  • 考虑添加到 .gitignore 中\n'));
                    
                    const shouldContinue = process.env.YUANGS_AUTO_CONTINUE === 'true';
                    if (!shouldContinue) {
                        console.log(chalk.cyan('💡 设置环境变量 YUANGS_AUTO_CONTINUE=true 可跳过此警告'));
                        spinner.stop();
                        return;
                    }
                }

                spinner.text = '加载 AI 模型配置...';
                const router = getRouter();
                const reviewer = new CodeReviewer(gitService, router);

                const level = options.level as ReviewLevel;
                spinner.text = `执行 ${level} 级别代码审查...`;

                let result;
                if (options.file) {
                    result = await reviewer.reviewFile(options.file, level);
                } else {
                    result = await reviewer.review(level, !options.unstaged);
                }

                spinner.succeed('代码审查完成');

                console.log(chalk.bold.cyan('\n🔍 代码审查报告\n'));
                const scoreColor = getScoreColor(result.score);
                console.log(chalk.bold('评分: ') + scoreColor(result.score.toString()) + chalk.bold('/100'));
                console.log(chalk.gray(`审查文件: ${result.filesReviewed} 个`));
                console.log(chalk.gray(`置信度: ${(result.confidence * 100).toFixed(1)}%`));
                
                if (result.degradation?.applied) {
                    console.log(chalk.yellow(`降级: ${result.degradation.originalLevel} → ${result.degradation.targetLevel}`));
                    console.log(chalk.gray(`原因: ${result.degradation.reason}`));
                }
                
                console.log();

                console.log(chalk.bold('📋 总体评价:'));
                console.log(chalk.white(`  ${result.summary}\n`));

                if (result.issues.length > 0) {
                    console.log(chalk.bold.red(`⚠️  发现 ${result.issues.length} 个问题:\n`));
                    for (const issue of result.issues) {
                        const icon = getSeverityIcon(issue.severity);
                        const color = getSeverityColor(issue.severity);
                        console.log(color(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
                        console.log(color(`     ${issue.message}`));
                        if (issue.suggestion) {
                            console.log(chalk.gray(`     💡 ${issue.suggestion}`));
                        }
                        console.log();
                    }
                } else {
                    console.log(chalk.green('✅ 未发现明显问题\n'));
                }

                if (result.strengths.length > 0) {
                    console.log(chalk.bold.green('👍 优点:\n'));
                    for (const strength of result.strengths) {
                        console.log(chalk.green(`  ✓ ${strength}`));
                    }
                    console.log();
                }

                if (result.recommendations.length > 0) {
                    console.log(chalk.bold.yellow('💡 建议:\n'));
                    for (const rec of result.recommendations) {
                        console.log(chalk.yellow(`  • ${rec}`));
                    }
                    console.log();
                }

                // 保存审查结果到 git_reviews.md
                if (options.save !== false) {
                    await saveReviewToFile(result, level, options, gitService);
                }
            } catch (error: any) {
                if (error.message.includes('requires model configuration') || error.message.includes('not configured')) {
                    spinner.fail('当前未配置 AI 模型，无法执行代码审查');
                    console.log(chalk.yellow('请运行 "yuangs config" 配置 AI 模型，或使用其他命令。'));
                } else if (error.message.includes('Deep review is not recommended')) {
                    spinner.fail('代码变更较多，跳过 deep 审查');
                    console.log(chalk.yellow('💡 建议：'));
                    console.log('  • 使用 --level standard');
                    console.log('  • 或指定 --file 进行重点审查');
                } else if (error.message.includes('No changes to review')) {
                    const gitService = new GitService();
                    const diff = await gitService.getDiff();
                    
                    if (!options.unstaged && diff.files.unstaged.length > 0) {
                        spinner.warn('当前没有已暂存 (staged) 的文件变更');
                        console.log(chalk.cyan('\n💡 建议：'));
                        console.log(`  • 运行 ${chalk.green('git add <file>')} 将文件加入暂存区`);
                        console.log(`  • 或运行 ${chalk.green('yuangs git review --unstaged')} 直接审查未暂存的变更`);
                    } else {
                        spinner.fail('没有检测到任何代码变更');
                    }
                } else {
                    spinner.fail(`错误: ${error.message}`);
                }
                process.exit(1);
            }
        });
}

// 辅助函数
function getScoreColor(score: number) {
    if (score >= 90) return chalk.green;
    if (score >= 70) return chalk.yellow;
    return chalk.red;
}

function getSeverityIcon(severity: IssueSeverity): string {
    const icons = {
        [IssueSeverity.INFO]: 'ℹ️',
        [IssueSeverity.WARNING]: '⚠️',
        [IssueSeverity.ERROR]: '❌',
        [IssueSeverity.CRITICAL]: '🚨',
    };
    return icons[severity] || '•';
}

function getSeverityColor(severity: IssueSeverity) {
    const colors = {
        [IssueSeverity.INFO]: chalk.blue,
        [IssueSeverity.WARNING]: chalk.yellow,
        [IssueSeverity.ERROR]: chalk.red,
        [IssueSeverity.CRITICAL]: chalk.bgRed.white,
    };
    return colors[severity] || chalk.white;
}

/**
 * 保存审查结果到 git_reviews.md
 */
async function saveReviewToFile(
    result: any,
    level: ReviewLevel,
    options: any,
    gitService: GitService
): Promise<void> {
    const filePath = path.join(process.cwd(), 'git_reviews.md');
    const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    try {
        // 获取分支信息
        const branchInfo = await gitService.getBranchInfo();
        const currentCommit = await gitService.getCurrentCommitHash().catch(() => 'N/A');
        
        // 构建 Markdown 内容
        const markdownContent = formatReviewAsMarkdown({
            timestamp,
            level,
            branch: branchInfo.current,
            commit: currentCommit.substring(0, 7),
            staged: !options.unstaged,
            files: options.file || `${result.filesReviewed} 个文件`,
            score: result.score,
            summary: result.summary,
            issues: result.issues,
            strengths: result.strengths,
            recommendations: result.recommendations
        });
        
        // 读取现有文件内容（如果存在）
        let existingContent = '';
        try {
            existingContent = fs.readFileSync(filePath, 'utf-8');
        } catch (e) {
            // 文件不存在，创建新文件
            existingContent = `> 📝 Git Code Review History\n> Generated by Yuangs CLI\n\n`;
        }
        
        // 添加新的审查记录
        const separator = '\n---\n\n';
        const newContent = existingContent + separator + markdownContent;
        
        // 写入文件
        fs.writeFileSync(filePath, newContent);
        
        console.log(chalk.gray(`\n💾 审查结果已保存到: ${path.relative(process.cwd(), filePath)}`));
    } catch (error: any) {
        console.warn(chalk.yellow(`\n⚠️  保存审查结果失败: ${error.message}`));
    }
}

/**
 * 格式化审查结果为 Markdown
 */
function formatReviewAsMarkdown(review: {
    timestamp: string;
    level: ReviewLevel;
    branch: string;
    commit: string;
    staged: boolean;
    files: string;
    score: number;
    summary: string;
    issues: any[];
    strengths: string[];
    recommendations: string[];
}): string {
    const scoreEmoji = review.score >= 90 ? '🌟' : review.score >= 70 ? '👍' : '⚠️';
    
    let md = `## 📋 Code Review - ${review.timestamp}\n\n`;
    
    // 元数据
    md += `**📊 评分:** ${scoreEmoji} ${review.score}/100  \n`;
    md += `**🔧 级别:** ${review.level.toUpperCase()}  \n`;
    md += `**🌿 分支:** \`${review.branch}\`  \n`;
    md += `**💾 提交:** \`${review.commit}\`  \n`;
    md += `**📂 范围:** ${review.staged ? '暂存区' : '未暂存'} (${review.files})  \n\n`;
    
    // 总体评价
    md += `### 📝 总体评价\n\n${review.summary}\n\n`;
    
    // 问题列表
    if (review.issues.length > 0) {
        md += `### ⚠️ 发现的问题 (${review.issues.length})\n\n`;
        review.issues.forEach((issue: any, index) => {
            const severityEmoji: Record<string, string> = {
                [IssueSeverity.INFO]: 'ℹ️',
                [IssueSeverity.WARNING]: '⚠️',
                [IssueSeverity.ERROR]: '❌',
                [IssueSeverity.CRITICAL]: '🚨',
            };
            const emoji = severityEmoji[issue.severity] || '•';
            
            md += `#### ${index + 1}. [${issue.severity?.toUpperCase() || 'UNKNOWN'}] ${issue.file}${issue.line ? `:${issue.line}` : ''}\n\n`;
            md += `${issue.message}\n\n`;
            if (issue.suggestion) {
                md += `**💡 建议:** ${issue.suggestion}\n\n`;
            }
            if (issue.snippet) {
                md += `<details>\n<summary>代码片段</summary>\n\n\`\`\`\n${issue.snippet}\n\`\`\`\n\n</details>\n\n`;
            }
        });
    } else {
        md += `### ✅ 未发现明显问题\n\n`;
    }
    
    // 优点
    if (review.strengths.length > 0) {
        md += `### 👍 优点\n\n`;
        review.strengths.forEach(strength => {
            md += `- ✅ ${strength}\n`;
        });
        md += '\n';
    }
    
    // 建议
    if (review.recommendations.length > 0) {
        md += `### 💡 建议\n\n`;
        review.recommendations.forEach(rec => {
            md += `- ${rec}\n`;
        });
        md += '\n';
    }
    
    // 添加一个跳转链接
    md += `[↑ 返回顶部](#)\n\n`;
    
    return md;
}
