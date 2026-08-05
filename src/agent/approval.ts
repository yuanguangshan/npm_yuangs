/**
 * 审批协调层 — 避免 governance 审批与工具内 confirm() 双重确认。
 *
 * 流程：
 *  1. governance 返回 require_approval → 运行时调用 setGovernanceApproved(true)
 *  2. 工具 execute 内部检查 isGovernanceApproved() → 跳过自身 confirm()
 *  3. 执行完毕后 clearGovernanceApproved() 重置
 */
let _governanceApproved = false;

/** 标记当前操作已通过 governance 层审批。 */
export function setGovernanceApproved(value: boolean): void {
  _governanceApproved = value;
}

/** 检查当前操作是否已被 governance 层审批通过。 */
export function isGovernanceApproved(): boolean {
  return _governanceApproved;
}

/** 清除审批标记（每次操作后应调用）。 */
export function clearGovernanceApproved(): void {
  _governanceApproved = false;
}
