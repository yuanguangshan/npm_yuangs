import { Policy, PolicyContext, PolicyResult } from './types';
import { RiskLevel, ProposedAction } from '../state';
import { DANGEROUS_SHELL_PATTERNS } from './policies/dangerousShellPatterns';

export class PolicyEngine {
  private policies: Map<string, Policy> = new Map();

  registerPolicy(policy: Policy): void {
    this.policies.set(policy.name, policy);
  }

  unregisterPolicy(name: string): void {
    this.policies.delete(name);
  }

  async evaluate(context: PolicyContext): Promise<PolicyResult> {
    let finalResult: PolicyResult = {
      allowed: true,
      reason: 'All policies passed'
    };

    for (const [name, policy] of this.policies) {
      const result = await policy.evaluate(context);

      if (!result.allowed) {
        return {
          allowed: false,
          reason: `Policy "${name}" blocked: ${result.reason}`,
          requiresEscalation: result.requiresEscalation || false,
          suggestedActions: result.suggestedActions
        };
      }

      if (result.requiresEscalation) {
        finalResult.requiresEscalation = true;
        finalResult.suggestedActions = result.suggestedActions;
      }
    }

    return finalResult;
  }

  evaluateRisk(action: ProposedAction): RiskLevel {
    const { type, payload } = action;

    if (type === 'tool_call') {
      const toolName = (payload as any).tool_name;

      const lowRiskTools = ['read_file', 'list_files', 'web_search'];
      if (lowRiskTools.includes(toolName)) {
        return 'low';
      }

      const mediumRiskTools = ['write_file', 'shell'];
      if (mediumRiskTools.includes(toolName)) {
        const cmd = (payload as any).parameters?.command || (payload as any).command || '';
        if (this.containsDangerousCommand(cmd)) {
          return 'high';
        }
        return 'medium';
      }

      return 'medium';
    }

    if (type === 'shell_cmd') {
      const cmd = (payload as any).command || '';
      if (this.containsDangerousCommand(cmd)) {
        return 'high';
      }
      return 'medium';
    }

    return 'low';
  }

  private containsDangerousCommand(cmd: string): boolean {
    return DANGEROUS_SHELL_PATTERNS.some(p => p.pattern.test(cmd));
  }
}

export const policyEngine = new PolicyEngine();
