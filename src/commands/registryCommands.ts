import { Command } from 'commander';
import chalk from 'chalk';
import { RegistryAPI } from '../api/registryAPI';
import type { Capability } from '../registry/manifest';

let registryAPI: RegistryAPI | null = null;

function getRegistryAPI(storagePath?: string): RegistryAPI {
  if (!registryAPI) {
    registryAPI = new RegistryAPI(storagePath);
  }
  return registryAPI;
}

export function registerRegistryCommands(program: Command) {
  program
    .command('registry')
    .description('Macro Registry 管理命令')
    .argument('[action]', 'publish, get, list, approve, deprecate, risk, explain')
    .argument('[id]', 'Macro ID')
    .argument('[version]', 'Macro version')
    .action(async (action, id, version) => {
      if (!action) {
        console.log(chalk.yellow('请指定操作: publish, get, list, approve, deprecate, risk, explain'));
        return;
      }

      try {
        const api = getRegistryAPI();
        await api.initialize();

        switch (action) {
          case 'publish':
            await handlePublish();
            break;
          case 'get':
            if (!id) {
              console.log(chalk.red('请指定 Macro ID'));
              return;
            }
            await handleGet(api, id, version);
            break;
          case 'list':
            await handleList(api);
            break;
          case 'approve':
            if (!id || !version) {
              console.log(chalk.red('请指定 Macro ID 和版本'));
              return;
            }
            await handleApprove(api, id, version);
            break;
          case 'deprecate':
            if (!id) {
              console.log(chalk.red('请指定 Macro ID'));
              return;
            }
            await handleDeprecate(api, id, version);
            break;
          case 'risk':
            if (!id) {
              console.log(chalk.red('请指定 Macro ID'));
              return;
            }
            await handleRisk(api, id, version);
            break;
          case 'explain':
            if (!id) {
              console.log(chalk.red('请指定 Macro ID 或 capability'));
              return;
            }
            await handleExplain(api, id);
            break;
          default:
            console.log(chalk.red(`未知操作: ${action}`));
        }
      } catch (error: any) {
        console.error(chalk.red(`错误: ${error.message}`));
        if (error.code) {
          console.log(chalk.gray(`错误代码: ${error.code}`));
        }
      }
    });
}

async function handlePublish() {
  const readline = require('node:readline/promises').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log(chalk.bold.cyan('\n📦 发布新 Macro\n'));

    const id = await readline.question(chalk.yellow('Macro ID: '));
    const version = await readline.question(chalk.yellow('Version: '));
    const description = await readline.question(chalk.yellow('Description: '));
    const author = await readline.question(chalk.yellow('Author: '));

    console.log(chalk.cyan('\n🔐 所需权限 (每行一个, 空行结束):'));
    const requires: Capability[] = [];
    while (true) {
      const cap = await readline.question('  ');
      if (!cap.trim()) break;
      requires.push(cap.trim() as Capability);
    }

    const tagsInput = await readline.question(chalk.yellow('Tags (用逗号分隔): '));
    const tags = tagsInput.split(',').map((t: string) => t.trim()).filter((t: string) => t);

    const api = getRegistryAPI();
    await api.initialize();

    const manifest = await api.publishMacro(
      id,
      version,
      description,
      requires,
      author,
      { autoApprove: false }
    );

    console.log(chalk.bold.green('\n✅ Macro 发布成功!\n'));
    console.log(chalk.white(`ID: ${manifest.id}`));
    console.log(chalk.white(`Version: ${manifest.version}`));
    console.log(chalk.white(`State: ${manifest.state}`));
    console.log(chalk.white(`Checksum: ${manifest.checksum}`));

    if (manifest.state === 'draft') {
      console.log(chalk.yellow('\n⚠️  Macro 处于 draft 状态, 需要审批后才能使用'));
      console.log(chalk.gray(`运行: yuangs registry approve ${id} ${version}`));
    }
  } finally {
    readline.close();
  }
}

async function handleGet(api: RegistryAPI, id: string, version?: string) {
  const manifest = await api.getMacro(id, version);

  if (!manifest) {
    console.log(chalk.red(`Macro ${id}${version ? `@${version}` : ''} 不存在`));
    return;
  }

  console.log(chalk.bold.cyan('\n📄 Macro 信息\n'));
  console.log(chalk.white(`ID: ${manifest.id}`));
  console.log(chalk.white(`Version: ${manifest.version}`));
  console.log(chalk.white(`State: ${formatState(manifest.state)}`));
  console.log(chalk.white(`Author: ${manifest.author}`));
  console.log(chalk.white(`Created: ${new Date(manifest.createdAt).toISOString()}`));
  console.log(chalk.white(`Description: ${manifest.description}`));

  console.log(chalk.cyan('\n🔐 所需权限:'));
  for (const cap of manifest.requires) {
    console.log(`  - ${chalk.white(cap)}`);
  }

  if (manifest.tags && manifest.tags.length > 0) {
    console.log(chalk.cyan('\n🏷️  Tags:'));
    console.log(`  ${manifest.tags.join(', ')}`);
  }

  console.log(chalk.gray(`\nChecksum: ${manifest.checksum}`));
}

async function handleList(api: RegistryAPI) {
  const manifests = await api.listMacros();

  if (manifests.length === 0) {
    console.log(chalk.yellow('没有找到任何 Macro'));
    return;
  }

  console.log(chalk.bold.cyan('\n📋 Macro 列表\n'));

  for (const manifest of manifests) {
    console.log(formatStateSymbol(manifest.state) + chalk.white(` ${manifest.id}@${manifest.version}`));
    console.log(chalk.gray(`  Author: ${manifest.author}`));
    console.log(chalk.gray(`  Created: ${new Date(manifest.createdAt).toLocaleDateString()}`));
    console.log(chalk.gray(`  ${manifest.description}\n`));
  }

  console.log(chalk.gray(`总计: ${manifests.length} 个 Macro\n`));
}

async function handleApprove(api: RegistryAPI, id: string, version: string) {
  const manifest = await api.approveMacro(id, version, process.env.USER || 'cli-user');

  console.log(chalk.bold.green('\n✅ Macro 审批通过!\n'));
  console.log(chalk.white(`ID: ${manifest.id}`));
  console.log(chalk.white(`Version: ${manifest.version}`));
  console.log(chalk.white(`State: ${manifest.state}`));
  console.log(chalk.gray(`Approved by: ${process.env.USER || 'cli-user'}`));
}

async function handleDeprecate(api: RegistryAPI, id: string, version?: string) {
  const manifest = await api.deprecateMacro(id, version);

  console.log(chalk.bold.yellow('\n⚠️  Macro 已弃用\n'));
  console.log(chalk.white(`ID: ${manifest.id}`));
  console.log(chalk.white(`Version: ${manifest.version}`));
  console.log(chalk.white(`State: ${manifest.state}`));
}

async function handleRisk(api: RegistryAPI, id: string, version?: string) {
  const assessment = await api.assessMacroRisk(id, version);

  if (!assessment) {
    console.log(chalk.red(`Macro ${id}${version ? `@${version}` : ''} 不存在`));
    return;
  }

  console.log(chalk.bold.cyan('\n⚠️  风险评估\n'));

  const riskColor = assessment.overallRisk === 'low' ? chalk.green :
    assessment.overallRisk === 'medium' ? chalk.yellow : chalk.red;

  console.log(riskColor(`总体风险: ${assessment.overallRisk.toUpperCase()}`));
  console.log(chalk.white(`风险评分: ${assessment.score}/10`));
  console.log(chalk.white(`需要审批: ${assessment.requiresApproval ? '是' : '否'}`));

  if (assessment.factors.length > 0) {
    console.log(chalk.cyan('\n风险因素:'));
    for (const factor of assessment.factors) {
      const factorColor = factor.severity === 'low' ? chalk.green :
        factor.severity === 'medium' ? chalk.yellow : chalk.red;
      console.log(`  [${factorColor(factor.severity.toUpperCase())}] ${factor.description}`);
      if (factor.suggestion) {
        console.log(chalk.gray(`    → ${factor.suggestion}`));
      }
    }
  }

  console.log(chalk.cyan('\n详细解释:'));
  console.log(assessment.explanation);
}

async function handleExplain(api: RegistryAPI, id: string) {
  try {
    const manifest = await api.getMacro(id);
    if (manifest) {
      const assessment = await api.assessMacroRisk(id);
      if (assessment) {
        console.log(assessment.explanation);
        return;
      }
    }

    const explanation = await api.explainCapability(id as Capability);
    console.log(explanation);
  } catch (error: any) {
    console.error(chalk.red(`错误: ${error.message}`));
  }
}

function formatState(state: string): string {
  switch (state) {
    case 'draft':
      return chalk.yellow('draft');
    case 'approved':
      return chalk.green('approved');
    case 'deprecated':
      return chalk.red('deprecated');
    default:
      return state;
  }
}

function formatStateSymbol(state: string): string {
  switch (state) {
    case 'draft':
      return chalk.yellow('📝');
    case 'approved':
      return chalk.green('✅');
    case 'deprecated':
      return chalk.red('⚠️ ');
    default:
      return '•';
  }
}
