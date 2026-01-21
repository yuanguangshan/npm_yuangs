import chalk from 'chalk';
import { ProposedAction, GovernanceDecision } from './state';
import { evaluateProposal, PolicyRule, RiskEntry } from './governance/core';
import { RiskLedger } from './governance/ledger';
import { WasmGovernanceBridge } from './governance/bridge';
import jsyaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

export class GovernanceService {
  private static rules: PolicyRule[] = [];
  private static ledger = new RiskLedger();
  private static initialized = false;

  static async init() {
    if (this.initialized) return;
    this.loadPolicy();
    await WasmGovernanceBridge.init();
    this.initialized = true;
  }

  private static loadPolicy() {
    try {
      const policyPath = path.join(process.cwd(), 'policy.yaml');
      if (fs.existsSync(policyPath)) {
        const content = fs.readFileSync(policyPath, 'utf8');
        const config = jsyaml.load(content) as any;
        this.rules = config.rules || [];
      }
    } catch (e) {
      this.rules = [];
    }
  }

  static getRules(): PolicyRule[] {
    return this.rules;
  }

  static getLedgerSnapshot(): RiskEntry[] {
    return this.ledger.getSnapshot();
  }

  static getPolicyManual(): string {
    return this.rules.map(r => `- ${r.id}: ${r.reason} (${r.effect})`).join('\n');
  }

  static async adjudicate(action: ProposedAction): Promise<GovernanceDecision> {
    await this.init();

    // 1. WASM 物理层核验
    const wasmResult = WasmGovernanceBridge.evaluate(action, this.rules, this.ledger.getSnapshot());
    if (wasmResult.effect === 'deny') {
      return { status: 'rejected', by: 'policy', reason: wasmResult.reason || 'WASM Denied', timestamp: Date.now() };
    }

    // 2. 逻辑层核验
    const logicResult = evaluateProposal(action, this.rules, this.ledger.getSnapshot());
    if (logicResult.effect === 'deny') {
      return { status: 'rejected', by: 'policy', reason: logicResult.reason || 'Policy Denied', timestamp: Date.now() };
    }

    if (logicResult.effect === 'allow') {
      this.ledger.record(action.type);
      return { status: 'approved', by: 'policy', timestamp: Date.now() };
    }

    // 3. 人工干预兜底
    console.log(chalk.yellow(`\n⚠️  Governance: Explicit approval required for ${action.type}`));
    if (action.type === 'shell_cmd') {
      console.log(chalk.bold.green('💻 Proposed Command: ') + chalk.yellow(action.payload.command));
    } else if (action.type === 'tool_call') {
      console.log(chalk.bold.green('🛠️  Tool: ') + chalk.cyan(`${action.payload.tool_name}(${JSON.stringify(action.payload.parameters)})`));
    }

    const { confirm } = await import('../utils/confirm');
    const ok = await confirm(`Do you want to proceed with this action?`);

    if (ok) {
      this.ledger.record(action.type);
      return { status: 'approved', by: 'human', timestamp: Date.now() };
    } else {
      return { status: 'rejected', by: 'human', reason: 'User declined execution', timestamp: Date.now() };
    }
  }
}
