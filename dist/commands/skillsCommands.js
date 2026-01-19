"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSkillsCommands = registerSkillsCommands;
const chalk_1 = __importDefault(require("chalk"));
const skills_1 = require("../agent/skills");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const SKILLS_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs_skills.json');
function loadSkills() {
    if (fs_1.default.existsSync(SKILLS_FILE)) {
        try {
            const data = fs_1.default.readFileSync(SKILLS_FILE, 'utf-8');
            return JSON.parse(data);
        }
        catch (e) {
            return [];
        }
    }
    return [];
}
function saveSkills(skills) {
    try {
        fs_1.default.writeFileSync(SKILLS_FILE, JSON.stringify(skills, null, 2));
    }
    catch (e) {
        console.error(chalk_1.default.red(`Failed to save skills to ${SKILLS_FILE}`));
    }
}
function registerSkillsCommands(program) {
    const skillsProgram = program.command('skills').description('Skill management commands');
    skillsProgram
        .command('list')
        .description('List all skills')
        .action(() => {
        const skills = (0, skills_1.getAllSkills)();
        const now = Date.now();
        if (skills.length === 0) {
            console.log(chalk_1.default.gray('📭 No skills found\n'));
            return;
        }
        console.log(chalk_1.default.bold.cyan(`\n📦 Skills (${skills.length})\n`));
        skills.forEach((skill) => {
            const status = skill.enabled ? chalk_1.default.green('✔') : chalk_1.default.gray('⊘');
            const score = (0, skills_1.computeSkillScore)(skill, now);
            const daysAgo = Math.floor((now - skill.lastUsed) / (1000 * 60 * 60 * 24));
            console.log(`${status} ${chalk_1.default.bold(skill.name)}`);
            console.log(chalk_1.default.gray(`  Confidence: ${(score * 100).toFixed(0)}%`));
            console.log(chalk_1.default.gray(`  Success: ${skill.successCount} / Failure: ${skill.failureCount}`));
            console.log(chalk_1.default.gray(`  Last used: ${daysAgo === 0 ? 'today' : `${daysAgo} days ago`}\n`));
        });
    });
    skillsProgram
        .command('explain <name>')
        .description('Explain a specific skill')
        .action((name) => {
        const skills = (0, skills_1.getAllSkills)();
        const skill = skills.find(s => s.name === name || s.id === name);
        if (!skill) {
            console.log(chalk_1.default.red(`❌ Skill "${name}" not found\n`));
            return;
        }
        console.log(chalk_1.default.bold.cyan(`\n📖 Skill Details: ${skill.name}\n`));
        console.log(chalk_1.default.white(`Description: ${skill.description}`));
        console.log(chalk_1.default.gray(`\nWhen to use:`));
        console.log(chalk_1.default.white(`  ${skill.whenToUse}`));
        console.log(chalk_1.default.gray(`\nMetrics:`));
        console.log(chalk_1.default.white(`  Success: ${skill.successCount} / Failure: ${skill.failureCount}`));
        console.log(chalk_1.default.white(`  Confidence: ${(skill.confidence * 100).toFixed(0)}%`));
        console.log(chalk_1.default.white(`  Enabled: ${skill.enabled ? 'Yes' : 'No'}`));
        console.log(chalk_1.default.gray(`\nCreated: ${new Date(skill.createdAt).toLocaleString()}`));
        console.log(chalk_1.default.gray(`Last used: ${new Date(skill.lastUsed).toLocaleString()}\n`));
    });
    skillsProgram
        .command('disable <name>')
        .description('Disable a skill')
        .action((name) => {
        const skills = loadSkills();
        const skillIndex = skills.findIndex(s => s.name === name || s.id === name);
        if (skillIndex === -1) {
            console.log(chalk_1.default.red(`❌ Skill "${name}" not found\n`));
            return;
        }
        if (!skills[skillIndex].enabled) {
            console.log(chalk_1.default.yellow(`ℹ️  Skill "${name}" is already disabled\n`));
            return;
        }
        skills[skillIndex].enabled = false;
        saveSkills(skills);
        console.log(chalk_1.default.green(`✓ Skill "${name}" has been disabled\n`));
    });
    skillsProgram
        .command('enable <name>')
        .description('Enable a skill')
        .action((name) => {
        const skills = loadSkills();
        const skillIndex = skills.findIndex(s => s.name === name || s.id === name);
        if (skillIndex === -1) {
            console.log(chalk_1.default.red(`❌ Skill "${name}" not found\n`));
            return;
        }
        if (skills[skillIndex].enabled) {
            console.log(chalk_1.default.yellow(`ℹ️  Skill "${name}" is already enabled\n`));
            return;
        }
        skills[skillIndex].enabled = true;
        saveSkills(skills);
        console.log(chalk_1.default.green(`✓ Skill "${name}" has been enabled\n`));
    });
}
//# sourceMappingURL=skillsCommands.js.map