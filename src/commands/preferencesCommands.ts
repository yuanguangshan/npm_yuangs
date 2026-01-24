import chalk from 'chalk';
import { Command } from 'commander';
import {
  PreferencesManager,
  buildPersonalizedPrompt,
  applyOutputFormat,
  buildContextStrategyPrompt
} from '../agent/preferences';

export function registerPreferencesCommands(program: Command): void {
  const preferencesProgram = program
    .command('preferences')
    .description('Manage AI interaction preferences');

  // List all preferences
  preferencesProgram
    .command('list')
    .description('List all current preferences')
    .action(() => {
      const prefs = PreferencesManager.getPreferences();

      console.log(chalk.bold.cyan('\n📋 Current Preferences\n'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      Object.entries(prefs).forEach(([key, value]) => {
        const formattedKey = formatKey(key);
        const formattedValue = formatValue(key, value);
        console.log(`  ${chalk.bold(formattedKey)}: ${formattedValue}`);
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

  // Get a specific preference
  preferencesProgram
    .command('get <key>')
    .description('Get a specific preference value')
    .action((key: string) => {
      const prefs = PreferencesManager.getPreferences();

      if (key in prefs) {
        const formattedKey = formatKey(key);
        const formattedValue = formatValue(key, (prefs as any)[key]);
        console.log(chalk.bold.cyan(`${formattedKey}: ${formattedValue}`));
      } else {
        console.log(chalk.red(`Unknown preference: ${key}`));
        console.log(chalk.gray('Use "yuangs preferences list" to see all available preferences.'));
      }
    });

  // Set a preference
  preferencesProgram
    .command('set <key> <value>')
    .description('Set a preference value')
    .action((key: string, value: string) => {
      const parsedValue = parseValue(key, value);

      if (parsedValue === null) {
        console.log(chalk.red(`Invalid value for ${key}: ${value}`));
        return;
      }

      PreferencesManager.setPreferences({ [key]: parsedValue } as any);
      const formattedKey = formatKey(key);
      const formattedValue = formatValue(key, parsedValue);
      console.log(chalk.green(`✓ ${formattedKey} set to ${formattedValue}`));
    });

  // Reset preferences to defaults
  preferencesProgram
    .command('reset')
    .description('Reset all preferences to defaults')
    .option('-y, --yes', 'Skip confirmation')
    .action((options) => {
      if (!options.yes) {
        console.log(chalk.yellow('⚠️  This will reset all preferences to default values.'));
        console.log(chalk.gray('Use --yes to confirm.\n'));
        return;
      }

      PreferencesManager.resetPreferences();
      console.log(chalk.green('✓ All preferences reset to defaults'));
    });

  // Show current prompt personalization
  preferencesProgram
    .command('show-prompt')
    .description('Show current personalized prompt')
    .action(() => {
      const prefs = PreferencesManager.getPreferences();
      const basePrompt = '你是一个专业的技术助手（Yuangs AI），专精于软件开发、系统管理和问题解决。';
      const personalized = buildPersonalizedPrompt(basePrompt, prefs);

      console.log(chalk.bold.cyan('\n📝 Current Personalized Prompt\n'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(personalized);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

  // Quick setup wizard
  preferencesProgram
    .command('setup')
    .description('Interactive preference setup')
    .action(async () => {
      const readline = (await import('readline')).createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const updates: any = {};

      console.log(chalk.bold.cyan('\n🔧 Yuangs AI Preference Setup\n'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Verbosity
      const verbosity = await ask(readline,
        'Verbosity level (concise/normal/detailed) [default: normal]: ',
        'normal'
      );
      if (['concise', 'normal', 'detailed'].includes(verbosity)) {
        updates.verbosity = verbosity;
      }

      // Language
      const language = await ask(readline,
        'Language (zh-CN/en-US/auto) [default: auto]: ',
        'auto'
      );
      if (['zh-CN', 'en-US', 'auto'].includes(language)) {
        updates.language = language;
      }

      // Explanation style
      const explanation = await ask(readline,
        'Explanation style (technical/beginner/adaptive) [default: adaptive]: ',
        'adaptive'
      );
      if (['technical', 'beginner', 'adaptive'].includes(explanation)) {
        updates.explanation = explanation;
      }

      // Context strategy
      const contextStrategy = await ask(readline,
        'Context strategy (smart/minimal/full) [default: smart]: ',
        'smart'
      );
      if (['smart', 'minimal', 'full'].includes(contextStrategy)) {
        updates.contextStrategy = contextStrategy;
      }

      // Auto-confirm
      const autoConfirm = await ask(readline,
        'Auto-confirm commands (yes/no) [default: no]: ',
        'no'
      );
      if (['yes', 'no'].includes(autoConfirm)) {
        updates.autoConfirm = autoConfirm === 'yes';
      }

      readline.close();

      if (Object.keys(updates).length > 0) {
        PreferencesManager.setPreferences(updates);
        console.log(chalk.green('\n✓ Preferences updated successfully!'));
      } else {
        console.log(chalk.yellow('\nNo changes made.'));
      }
    });
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatValue(key: string, value: any): string {
  if (typeof value === 'boolean') {
    return value ? chalk.green('enabled') : chalk.red('disabled');
  }
  if (typeof value === 'string') {
    return chalk.cyan(`"${value}"`);
  }
  return String(value);
}

function parseValue(key: string, value: string): any {
  switch (key) {
    case 'verbosity':
      if (['concise', 'normal', 'detailed'].includes(value)) {
        return value;
      }
      return null;

    case 'language':
      if (['zh-CN', 'en-US', 'auto'].includes(value)) {
        return value;
      }
      return null;

    case 'codeStyle':
      if (['functional', 'imperative', 'any'].includes(value)) {
        return value;
      }
      return null;

    case 'explanation':
      if (['technical', 'beginner', 'adaptive'].includes(value)) {
        return value;
      }
      return null;

    case 'outputFormat':
      if (['markdown', 'plain', 'structured'].includes(value)) {
        return value;
      }
      return null;

    case 'contextStrategy':
      if (['smart', 'minimal', 'full'].includes(value)) {
        return value;
      }
      return null;

    case 'autoConfirm':
      if (['true', 'yes', '1', 'enabled'].includes(value.toLowerCase())) {
        return true;
      }
      if (['false', 'no', '0', 'disabled'].includes(value.toLowerCase())) {
        return false;
      }
      return null;

    default:
      return value;
  }
}

function ask(rl: any, question: string, defaultVal: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${chalk.cyan(question)}`, (answer: string) => {
      resolve(answer.trim() || defaultVal);
    });
  });
}
