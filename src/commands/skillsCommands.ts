import chalk from 'chalk';
import { Command } from 'commander';
import { getAllSkills, computeSkillScore, enableSkill, disableSkill } from '../agent/skills';

export function registerSkillsCommands(program: Command): void {
    const skillsProgram = program.command('skills').description('Skill management commands');

    skillsProgram
        .command('list')
        .description('List all skills')
        .action(() => {
            const skills = getAllSkills();
            const now = Date.now();

            if (skills.length === 0) {
                console.log(chalk.gray('📭 No skills found\n'));
                return;
            }

            console.log(chalk.bold.cyan(`\n📦 Skills (${skills.length})\n`));

            skills.forEach((skill) => {
                const status = skill.enabled ? chalk.green('✔') : chalk.gray('⊘');
                const score = computeSkillScore(skill, now);
                const daysAgo = Math.floor((now - skill.lastUsed) / (1000 * 60 * 60 * 24));

                console.log(`${status} ${chalk.bold(skill.name)}`);
                console.log(chalk.gray(`  Confidence: ${(score * 100).toFixed(0)}%`));
                console.log(chalk.gray(`  Success: ${skill.successCount} / Failure: ${skill.failureCount}`));
                console.log(chalk.gray(`  Last used: ${daysAgo === 0 ? 'today' : `${daysAgo} days ago`}\n`));
            });
        });

    skillsProgram
        .command('explain <name>')
        .description('Explain a specific skill')
        .action((name) => {
            const skills = getAllSkills();
            const skill = skills.find(s => s.name === name || s.id === name);

            if (!skill) {
                console.log(chalk.red(`❌ Skill "${name}" not found\n`));
                return;
            }

            console.log(chalk.bold.cyan(`\n📖 Skill Details: ${skill.name}\n`));
            console.log(chalk.white(`Description: ${skill.description}`));
            console.log(chalk.gray(`\nWhen to use:`));
            console.log(chalk.white(`  ${skill.whenToUse}`));
            console.log(chalk.gray(`\nMetrics:`));
            console.log(chalk.white(`  Success: ${skill.successCount} / Failure: ${skill.failureCount}`));
            console.log(chalk.white(`  Confidence: ${(skill.confidence * 100).toFixed(0)}%`));
            console.log(chalk.white(`  Enabled: ${skill.enabled ? 'Yes' : 'No'}`));
            console.log(chalk.gray(`\nCreated: ${new Date(skill.createdAt).toLocaleString()}`));
            console.log(chalk.gray(`Last used: ${new Date(skill.lastUsed).toLocaleString()}\n`));
        });

    skillsProgram
        .command('disable <name>')
        .description('Disable a skill')
        .action((name) => {
            const ok = disableSkill(name);
            if (!ok) {
                console.log(chalk.red(`❌ Skill "${name}" not found\n`));
                return;
            }
            console.log(chalk.green(`✓ Skill "${name}" has been disabled\n`));
        });

    skillsProgram
        .command('enable <name>')
        .description('Enable a skill')
        .action((name) => {
            const ok = enableSkill(name);
            if (!ok) {
                console.log(chalk.red(`❌ Skill "${name}" not found\n`));
                return;
            }
            console.log(chalk.green(`✓ Skill "${name}" has been enabled\n`));
        });
}
