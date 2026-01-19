import { Policy, PolicyContext, PolicyResult } from './types';
import { RiskLevel } from '../state';

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

  evaluateRisk(action: { type: string; payload: any }): RiskLevel {
    const { type, payload } = action;

    if (type === 'tool_call') {
      const toolName = payload.tool_name;
      
      const lowRiskTools = ['read_file', 'list_files', 'web_search'];
      if (lowRiskTools.includes(toolName)) {
        return 'low';
      }

      const mediumRiskTools = ['write_file', 'shell'];
      if (mediumRiskTools.includes(toolName)) {
        const cmd = payload.parameters?.command || payload.command || '';
        if (this.containsDangerousCommand(cmd)) {
          return 'high';
        }
        return 'medium';
      }

      return 'medium';
    }

    if (type === 'shell_cmd') {
      const cmd = payload.command || '';
      if (this.containsDangerousCommand(cmd)) {
        return 'high';
      }
      return 'medium';
    }

    return 'low';
  }

  private containsDangerousCommand(cmd: string): boolean {
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,
      /rm\s+-rf\s+~/,
      />\s*\/dev\/null/,
      /dd\s+if=/,
      /mkfs/,
      /format/,
      /sudo\s+rm/
    ];

    return dangerousPatterns.some(pattern => pattern.test(cmd));
  }
}

export const policyEngine = new PolicyEngine();
