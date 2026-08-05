// Original governance module exports
export * from './bridge';
export * from './core';
export * from './ledger';
export { defaultRiskScoringModel, RiskScoringModel } from './riskScoring';
export type { RiskScoringConfig, RiskFactor, RiskAssessment } from './riskScoring';

// Note: New causal tracking modules are in src/engine/agent/governance/
// These are imported directly when needed to avoid circular dependencies
