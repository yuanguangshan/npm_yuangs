import chalk from 'chalk';
import { Command } from 'commander';
import { explainExecution } from '../core/explain';
import { loadExecutionRecord, listExecutionRecords } from '../core/executionStore';

export function registerExplainCommands(program: Command): void {
  program
    .command('explain [id]')
    .description('Explain an execution (use "last" for most recent)')
    .action((id) => {
      let record;

      if (!id || id === 'last') {
        const records = listExecutionRecords(1);
        if (records.length === 0) {
          console.log(chalk.red('❌ No execution records found\n'));
          return;
        }
        record = records[0];
        console.log(chalk.gray(`Showing most recent execution: ${record.id}\n`));
      } else {
        record = loadExecutionRecord(id);
        if (!record) {
          console.log(chalk.red(`❌ Execution record "${id}" not found\n`));
          return;
        }
      }

      const explanation = explainExecution(record);
      console.log(explanation);
    });
}
