import readline from 'readline';
import { ProposedAction, GovernanceDecision, RiskLevel } from './state';
import chalk from 'chalk';
import ora from 'ora';

export class GovernanceService {
  static async adjudicate(
    action: ProposedAction,
    config: { autoApproveLowRisk: boolean } = { autoApproveLowRisk: true }
  ): Promise<GovernanceDecision> {
    const { autoApproveLowRisk } = config;

    if (autoApproveLowRisk && action.riskLevel === 'low') {
      console.log(chalk.gray(`[Auto-approved] ${action.type}: low risk action`));
      return {
        status: 'approved',
        by: 'policy',
        timestamp: Date.now()
      };
    }

    const spinner = ora(chalk.yellow('⏸️  Waiting for approval...')).start();

    const answer = await this.askHuman(action);
    spinner.stop();

    if (answer.approve) {
      return {
        status: 'approved',
        by: 'human',
        timestamp: Date.now()
      };
    } else if (answer.modify) {
      return {
        status: 'modified',
        by: 'human',
        originalActionId: action.id,
        modifiedAction: answer.modifiedAction!,
        modificationReason: answer.reason || 'User modified',
        timestamp: Date.now()
      };
    } else {
      return {
        status: 'rejected',
        by: 'human',
        reason: answer.reason || 'User rejected',
        timestamp: Date.now()
      };
    }
  }

  private static askHuman(action: ProposedAction): Promise<{
    approve: boolean;
    modify: boolean;
    modifiedAction?: ProposedAction;
    reason?: string;
  }> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      this.printActionDetails(action);

      const prompt = `
${chalk.bold.yellow('Proceed?')} (y/n/s) 
${chalk.gray('y = yes, n = no, s = skip/modify')}: `;

      rl.question(prompt, (answer) => {
        const lower = answer.trim().toLowerCase();

        if (lower === 'y' || lower === 'yes') {
          rl.close();
          resolve({ approve: true, modify: false });
        } else if (lower === 's' || lower === 'skip' || lower === 'modify') {
          rl.close();
          resolve({ 
            approve: false, 
            modify: true, 
            reason: 'User wants to modify',
            modifiedAction: { ...action } 
          });
        } else {
          rl.question(chalk.red('Reason for rejection: '), (reason) => {
            rl.close();
            resolve({ 
              approve: false, 
              modify: false, 
              reason: reason || 'User rejected' 
            });
          });
        }
      });
    });
  }

  private static printActionDetails(action: ProposedAction): void {
    const riskColor = {
      low: chalk.green,
      medium: chalk.yellow,
      high: chalk.red
    };

    console.log(`
${chalk.bold.cyan('═'.repeat(60))}
${chalk.bold.blue('📋 Action Proposed')}
${chalk.bold.cyan('═'.repeat(60))}
${chalk.white('Type:')} ${chalk.bold(action.type)}
${chalk.white('ID:')} ${action.id}
${chalk.white('Risk:')} ${riskColor[action.riskLevel](action.riskLevel.toUpperCase())}

${chalk.bold('Payload:')}
${chalk.gray(JSON.stringify(action.payload, null, 2))}

${chalk.bold('Reasoning:')}
${chalk.gray(action.reasoning)}
${chalk.bold.cyan('═'.repeat(60))}
`);
  }

  static evaluateRisk(action: ProposedAction): RiskLevel {
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

    if (type === 'code_diff') {
      return 'medium';
    }

    return 'low';
  }

  private static containsDangerousCommand(cmd: string): boolean {
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
