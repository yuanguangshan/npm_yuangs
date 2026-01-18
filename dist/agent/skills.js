"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSkillStatus = updateSkillStatus;
exports.learnSkillFromRecord = learnSkillFromRecord;
exports.getRelevantSkills = getRelevantSkills;
exports.reapColdSkills = reapColdSkills;
exports.getAllSkills = getAllSkills;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const SKILLS_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs_skills.json');
let skillLibrary = [];
// === Persistence Logic ===
function loadSkills() {
    if (fs_1.default.existsSync(SKILLS_FILE)) {
        try {
            const data = fs_1.default.readFileSync(SKILLS_FILE, 'utf-8');
            skillLibrary = JSON.parse(data);
        }
        catch (e) {
            console.error(chalk_1.default.yellow(`Failed to load skills from ${SKILLS_FILE}, starting empty.`));
            skillLibrary = [];
        }
    }
}
function saveSkills() {
    try {
        fs_1.default.writeFileSync(SKILLS_FILE, JSON.stringify(skillLibrary, null, 2));
    }
    catch (e) {
        console.error(chalk_1.default.red(`Failed to save skills to ${SKILLS_FILE}`));
    }
}
// Initialize on load
loadSkills();
// === Existing Logic with Save Hooks ===
/**
 * 计算技能分 (0 ~ 1)
 */
function computeSkillScore(skill, now = Date.now()) {
    const totalUses = skill.successCount + skill.failureCount;
    const successRate = totalUses === 0 ? 0.5 : skill.successCount / totalUses;
    // 时间衰减 (Freshness): 半衰期约 14 天
    const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);
    const freshness = Math.exp(-idleDays / 14);
    // 综合得分: 45% 成功率 + 35% 新鲜度 + 20% 置信度
    return (0.45 * successRate) + (0.35 * freshness) + (0.20 * skill.confidence);
}
/**
 * 更新技能状态 (执行后调用)
 */
function updateSkillStatus(skillId, success) {
    const skill = skillLibrary.find(s => s.id === skillId);
    if (!skill)
        return;
    skill.lastUsed = Date.now();
    if (success) {
        skill.successCount++;
        // 成功奖励: 置信度缓慢提升
        skill.confidence = Math.min(1, skill.confidence + 0.05);
    }
    else {
        skill.failureCount++;
        // 失败惩罚: 惩罚力度大于奖励，防止系统“自嗨”
        skill.confidence = Math.max(0, skill.confidence - 0.1);
    }
    saveSkills(); // Persist changes
}
/**
 * 自动学习新技能
 */
function learnSkillFromRecord(record, success = true) {
    if (record.mode === 'chat' || !record.llmResult.plan)
        return;
    const existingSkill = skillLibrary.find(s => s.name === record.llmResult.plan?.goal);
    if (existingSkill) {
        updateSkillStatus(existingSkill.id, success);
        return;
    }
    // 只有成功的记录才被学为新技能
    if (!success)
        return;
    const now = Date.now();
    skillLibrary.push({
        id: record.id,
        name: record.llmResult.plan.goal,
        description: `自动学习的技能: ${record.llmResult.plan.goal}`,
        whenToUse: record.input.rawInput,
        planTemplate: record.llmResult.plan,
        successCount: 1,
        failureCount: 0,
        confidence: 0.5,
        lastUsed: now,
        createdAt: now
    });
    // 每学习一次，尝试清理一次“冷”技能
    reapColdSkills();
    saveSkills(); // Persist changes
}
/**
 * 筛选并排序技能 (用于注入 Prompt)
 */
function getRelevantSkills(input, limit = 3) {
    const now = Date.now();
    return skillLibrary
        // 1. 基础筛选: 剔除评分过低的技能 (硬淘汰阈值 0.3)
        .filter(s => computeSkillScore(s, now) >= 0.3)
        // 2. 排序: 按综合分排序
        .sort((a, b) => computeSkillScore(b, now) - computeSkillScore(a, now))
        // 3. 取上限
        .slice(0, limit);
}
/**
 * 清理过期或低质技能 (Reaper)
 */
function reapColdSkills() {
    const now = Date.now();
    const initialCount = skillLibrary.length;
    skillLibrary = skillLibrary.filter(skill => {
        const score = computeSkillScore(skill, now);
        const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);
        // 满足以下任一条件则淘汰:
        // 1. 得分极低且长期不用
        if (score < 0.25 && idleDays > 30)
            return false;
        // 2. 失败率极高且尝试过一定次数
        if (skill.failureCount > 5 && (skill.successCount / (skill.successCount + skill.failureCount)) < 0.2)
            return false;
        return true;
    });
    // 强制保持容量
    if (skillLibrary.length > 100) {
        // 如果还超标，移除得分最低的那个
        skillLibrary.sort((a, b) => computeSkillScore(a, now) - computeSkillScore(b, now));
        skillLibrary.shift();
    }
    if (skillLibrary.length !== initialCount) {
        saveSkills(); // Persist if changes happened
    }
}
function getAllSkills() {
    return [...skillLibrary];
}
//# sourceMappingURL=skills.js.map