import { RiskLevel } from '../state';
import { ProposedAction } from '../state';

export type AgentMode = 'chat' | 'command' | 'command+exec';

export interface PolicyContext {
  action: ProposedAction;
  cwd: string;
  mode: AgentMode;
  history: ProposedAction[];
  user?: {
    permissions: string[];
  };
  environment?: {
    isProduction: boolean;
  };
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  requiresEscalation?: boolean;
  suggestedActions?: string[];
}

export interface Policy {
  name: string;
  description: string;
  evaluate(context: PolicyContext): PolicyResult | Promise<PolicyResult>;
}
