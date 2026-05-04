import chalk from 'chalk';
import { ProposedAction, GovernanceDecision, ShellCmdPayload, ToolCallPayload } from './state';
import { evaluateProposal, PolicyRule, RiskEntry } from './governance/core';
import { RiskLedger } from './governance/ledger';
import { WasmGovernanceBridge } from './governance/bridge';
import { generateRiskDisclosure, formatRiskDisclosureCLI, extractRiskFactorsFromThought, RiskFactors } from './riskDisclosure';
import { RiskScoringModel, RiskAssessment, defaultRiskScoringModel } from './governance/riskScoring';
import jsyaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

export class GovernanceService {
  private static rules: PolicyRule[] = [];
  private static ledger = new RiskLedger();
  private static riskModel: RiskScoringModel = defaultRiskScoringModel;
  private static initialized = false;
  private static currentUserId?: string;

  static async init() {
    if (this.initialized) return;
    this.loadPolicy();
    await WasmGovernanceBridge.init();
    this.initialized = true;
  }

  /**
   * 设置当前用户 ID（用于信任度评估）
   */
  static setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * 获取风险评分模型（用于信任度更新等操作）
   */
  static getRiskModel(): RiskScoringModel {
    return this.riskModel;
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

    // 0. 风险评分量化 (新增)
    const riskAssessment = this.riskModel.assessRisk(action, this.currentUserId);

    // 如果建议是自动允许且风险低，快速通过
    if (riskAssessment.suggestedAction === 'auto-allow' && riskAssessment.level === 'low') {
      this.ledger.record(action.type);
      return {
        status: 'approved',
        by: 'policy',
        timestamp: Date.now(),
        riskScore: riskAssessment.score
      };
    }

    // 如果建议是直接拒绝且风险极高，直接拒绝
    if (riskAssessment.suggestedAction === 'deny' && riskAssessment.level === 'critical') {
      return {
        status: 'rejected',
        by: 'policy',
        reason: `风险评分过高 (${riskAssessment.score}/100): ${this.getPrimaryRiskReason(riskAssessment)}`,
        timestamp: Date.now(),
        riskScore: riskAssessment.score
      };
    }

    // 1. WASM 物理层核验
    const wasmResult = WasmGovernanceBridge.evaluate(action, this.rules, this.ledger.getSnapshot());
    if (wasmResult.effect === 'deny') {
      return { status: 'rejected', by: 'policy', reason: wasmResult.reason || 'WASM Denied', timestamp: Date.now(), riskScore: riskAssessment.score };
    }

    // 2. 逻辑层核验
    const logicResult = evaluateProposal(action, this.rules, this.ledger.getSnapshot());
    if (logicResult.effect === 'deny') {
      return { status: 'rejected', by: 'policy', reason: logicResult.reason || 'Policy Denied', timestamp: Date.now(), riskScore: riskAssessment.score };
    }

    if (logicResult.effect === 'allow') {
      this.ledger.record(action.type);
      return { status: 'approved', by: 'policy', timestamp: Date.now(), riskScore: riskAssessment.score };
    }

    // 3. 人工干预兜底
    console.log(chalk.yellow(`\n⚠️  Governance: Explicit approval required for ${action.type}`));
    if (action.type === 'shell_cmd') {
      console.log(chalk.bold.green('💻 Proposed Command: ') + chalk.yellow((action.payload as unknown as ShellCmdPayload).command));
    } else if (action.type === 'tool_call') {
      const toolPayload = action.payload as unknown as ToolCallPayload;
      console.log(chalk.bold.green('🛠️  Tool: ') + chalk.cyan(`${toolPayload.tool_name}(${JSON.stringify(toolPayload.parameters)})`));
    }

    // 显示量化风险评分
    console.log(chalk.bold(`\n📊 Risk Assessment: ${riskAssessment.score}/100 (${riskAssessment.level.toUpperCase()})`));
    console.log(chalk.gray(`   Confidence: ${(riskAssessment.confidence * 100).toFixed(0)}% | User Trust: ${(riskAssessment.userTrust * 100).toFixed(0)}%`));

    // 显示主要风险因子
    const topFactors = riskAssessment.factors
      .filter(f => f.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (topFactors.length > 0) {
      console.log(chalk.bold('\n   Key Risk Factors:'));
      for (const factor of topFactors) {
        const bar = '█'.repeat(Math.floor(factor.score * 20));
        console.log(`   ${chalk.dim('•')} ${factor.name.padEnd(20)} ${chalk.yellow(bar)} ${chalk.white((factor.score * 100).toFixed(0))+'%'} - ${factor.reason}`);
      }
    }

    // Generate and display risk disclosure
    const riskFactors: RiskFactors = extractRiskFactorsFromThought(action.reasoning || '');
    riskFactors.commandType = action.type;
    if (action.type === 'shell_cmd') {
      riskFactors.command = (action.payload as unknown as ShellCmdPayload).command;
    }
    riskFactors.isDestructive = (action.payload as Record<string, unknown>).risk_level === 'high';

    const disclosure = generateRiskDisclosure(riskFactors);
    console.log(formatRiskDisclosureCLI(disclosure));

    const { confirm } = await import('../utils/confirm');
    const ok = await confirm(`Do you want to proceed with this action?`);

    if (ok) {
      this.ledger.record(action.type);

      // 成功执行后增加用户信任度
      if (this.currentUserId) {
        this.riskModel.updateUserTrust(this.currentUserId, 'success', 0.05);
      }

      return { status: 'approved', by: 'human', timestamp: Date.now(), riskScore: riskAssessment.score };
    } else {
      // 用户拒绝，降低信任度
      if (this.currentUserId) {
        this.riskModel.updateUserTrust(this.currentUserId, 'failure', 0.02);
      }

      return { status: 'rejected', by: 'human', reason: 'User declined execution', timestamp: Date.now(), riskScore: riskAssessment.score };
    }
  }

  /**
   * 获取主要风险原因（用于拒绝消息）
   */
  private static getPrimaryRiskReason(assessment: RiskAssessment): string {
    const topFactor = assessment.factors
      .filter(f => f.score > 0.2)
      .sort((a, b) => b.score - a.score)[0];

    return topFactor ? topFactor.reason : 'High overall risk';
  }

  /**
   * 获取用户信任度统计
   */
  static getUserTrustStats(): Map<string, { trust: number; lastSeen: number }> {
    return this.riskModel.getTrustStats();
  }

  /**
   * 重置用户信任度
   */
  static resetUserTrust(userId?: string): void {
    this.riskModel.resetUserTrust(userId);
  }
}
