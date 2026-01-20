"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSummary = renderSummary;
exports.renderDiffForReview = renderDiffForReview;
exports.renderRiskAssessment = renderRiskAssessment;
exports.promptForApproval = promptForApproval;
const chalk_1 = __importDefault(require("chalk"));
function renderSummary(files) {
    console.log(chalk_1.default.bold("\nDiff Summary\n"));
    for (const f of files) {
        console.log(`${chalk_1.default.cyan(f.file)}  ` +
            chalk_1.default.green(`+${f.additions}`) +
            " " +
            chalk_1.default.red(`-${f.deletions}`));
    }
}
function renderDiffForReview(files, rationale) {
    console.log(chalk_1.default.bold.cyan("=".repeat(60)));
    console.log(chalk_1.default.bold.blue("Proposed Code Change"));
    console.log(chalk_1.default.bold.cyan("=".repeat(60)));
    console.log(`${chalk_1.default.bold("Rationale:")} ${rationale}\n`);
    for (const f of files) {
        console.log(chalk_1.default.yellow(`\n📄 ${f.file}`));
        console.log(`   ${chalk_1.default.green("+")} ${f.additions} lines added`);
        console.log(`   ${chalk_1.default.red("-")} ${f.deletions} lines deleted`);
    }
    console.log(chalk_1.default.bold.cyan("\n" + "=".repeat(60)));
}
function renderRiskAssessment(level, warnings) {
    const levelColor = {
        low: chalk_1.default.green,
        medium: chalk_1.default.yellow,
        high: chalk_1.default.red,
    };
    console.log(chalk_1.default.bold(`\n${levelColor[level]}(\u26a0\ufe0f  Risk Level: ${level.toUpperCase()})`));
    if (warnings.length > 0) {
        for (const w of warnings) {
            console.log(chalk_1.default.yellow(`   - ${w}`));
        }
    }
}
function promptForApproval() {
    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(chalk_1.default.bold.yellow('\nType "YES" to approve, anything else to reject: '), (answer) => {
            rl.close();
            resolve(answer.trim() === "YES");
        });
    });
}
//# sourceMappingURL=render.js.map