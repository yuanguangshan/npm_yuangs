import { CapabilityLevel } from '../capability/CapabilityLevel';
import {
  PlanOutput,
  AutoOutput,
  ReviewOutput
} from './types';

export type Capability =
  | 'ReadRepo'
  | 'GeneratePatch'
  | 'ApplyPatchDryRun'
  | 'ApplyPatch'
  | 'Commit'
  | 'ReviewCode'
  | 'AnalyzeSemantics';

export interface ConstraintContext {
  step: 'plan' | 'auto' | 'review';
  capabilityLevel: CapabilityLevel;
  plan?: PlanOutput;
  auto?: AutoOutput;
  review?: ReviewOutput;
}

export interface Constraint {
  capability: Capability;
  description: string;
  allow(ctx: ConstraintContext): boolean;
  denyReason?(ctx: ConstraintContext): string;
}

export class ConstraintEngine {
  private constraints: Constraint[] = [];

  register(constraint: Constraint): void {
    this.constraints.push(constraint);
  }

  unregister(capability: Capability): void {
    this.constraints = this.constraints.filter(c => c.capability !== capability);
  }

  assertAllowed(
    capability: Capability,
    ctx: ConstraintContext
  ): void {
    const constraint = this.constraints.find(c => c.capability === capability);

    if (!constraint) {
      return;
    }

    if (!constraint.allow(ctx)) {
      const reason = constraint.denyReason ? constraint.denyReason(ctx) : `Capability ${capability} not allowed in current context`;
      throw new Error(`Capability denied: ${reason}`);
    }
  }

  isAllowed(
    capability: Capability,
    ctx: ConstraintContext
  ): boolean {
    const constraint = this.constraints.find(c => c.capability === capability);

    if (!constraint) {
      return true;
    }

    return constraint.allow(ctx);
  }

  getAllowedCapabilities(ctx: ConstraintContext): Capability[] {
    return this.constraints
      .filter(c => c.allow(ctx))
      .map(c => c.capability);
  }
}

export class DefaultConstraints {
  static readRepo(ctx: ConstraintContext): boolean {
    return ctx.capabilityLevel >= CapabilityLevel.TEXT;
  }

  static generatePatch(ctx: ConstraintContext): boolean {
    return ctx.capabilityLevel >= CapabilityLevel.SEMANTIC;
  }

  static applyPatchDryRun(ctx: ConstraintContext): boolean {
    return ctx.capabilityLevel >= CapabilityLevel.STRUCTURAL;
  }

  static applyPatch(ctx: ConstraintContext): boolean {
    return ctx.capabilityLevel >= CapabilityLevel.SEMANTIC && !!ctx.auto?.dryRunApplied;
  }

  static commit(ctx: ConstraintContext): boolean {
    return ctx.capabilityLevel >= CapabilityLevel.STRUCTURAL && !!ctx.auto?.patch;
  }

  static reviewCode(ctx: ConstraintContext): boolean {
    return ctx.capabilityLevel >= CapabilityLevel.LINE;
  }

  static analyzeSemantics(ctx: ConstraintContext): boolean {
    return ctx.capabilityLevel >= CapabilityLevel.SEMANTIC;
  }

  static getAll(): Constraint[] {
    return [
      {
        capability: 'ReadRepo',
        description: 'Read repository contents and Git history',
        allow: DefaultConstraints.readRepo,
        denyReason: (ctx) => `Capability level ${ctx.capabilityLevel} too low for repository access (requires TEXT+)`
      },
      {
        capability: 'GeneratePatch',
        description: 'Generate code changes using AI',
        allow: DefaultConstraints.generatePatch,
        denyReason: (ctx) => `Capability level ${ctx.capabilityLevel} too low for code generation (requires SEMANTIC+)`
      },
      {
        capability: 'ApplyPatchDryRun',
        description: 'Apply changes in dry-run mode (no commit)',
        allow: DefaultConstraints.applyPatchDryRun,
        denyReason: (ctx) => `Capability level ${ctx.capabilityLevel} too low for dry-run application (requires STRUCTURAL+)`
      },
      {
        capability: 'ApplyPatch',
        description: 'Apply changes to file system',
        allow: DefaultConstraints.applyPatch,
        denyReason: (ctx) => `Dry-run must be executed before actual apply, or capability too low (requires SEMANTIC+)`
      },
      {
        capability: 'Commit',
        description: 'Commit changes to Git',
        allow: DefaultConstraints.commit,
        denyReason: (ctx) => `No patch generated or capability too low (requires STRUCTURAL+)`
      },
      {
        capability: 'ReviewCode',
        description: 'Review code for quality and security',
        allow: DefaultConstraints.reviewCode,
        denyReason: (ctx) => `Capability level ${ctx.capabilityLevel} too low for code review (requires LINE+)`
      },
      {
        capability: 'AnalyzeSemantics',
        description: 'Perform semantic analysis of code',
        allow: DefaultConstraints.analyzeSemantics,
        denyReason: (ctx) => `Capability level ${ctx.capabilityLevel} too low for semantic analysis (requires SEMANTIC+)`
      }
    ];
  }
}

export const defaultConstraintEngine = new ConstraintEngine();
DefaultConstraints.getAll().forEach(c => defaultConstraintEngine.register(c));
