/**
 * 向用户请求确认。
 *
 * 三种模式：
 *  1. YUANGS_NO_CONFIRM=1 环境变量 → 自动放行（CI/CD、自动化脚本）
 *  2. 非 TTY（stdin 管道/重定向）→ 自动放行 + 警告
 *  3. 交互式 TTY → readline 提示 y/N
 */
export declare function confirm(message: string): Promise<boolean>;
