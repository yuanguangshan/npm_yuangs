"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiffEditCommand = createDiffEditCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const GovernanceEngine_1 = require("../GovernanceEngine");
const CodeChangeAction_1 = require("../actions/CodeChangeAction");
const diffParser_1 = require("../review/diffParser");
const render_1 = require("../review/render");
const sandbox_1 = require("../execution/sandbox");
const store_1 = require("../storage/store");
const engine = new GovernanceEngine_1.GovernanceEngine();
(0, store_1.auditActions)((0, store_1.loadActions)());
function collectGitResult(commitHash) {
    try {
        const output = (0, child_process_1.execSync)(`git show --stat --oneline ${commitHash}`, {
            encoding: "utf-8",
        });
        const files = [];
        let insertions = 0;
        let deletions = 0;
        for (const line of output.split("\n")) {
            const fileMatch = line.match(/^\s*(.+?)\s+\|\s+\d+/);
            if (fileMatch) {
                files.push(fileMatch[1].trim());
            }
            const insMatch = line.match(/(\d+)\s+insertions?\(\+\)/);
            const delMatch = line.match(/(\d+)\s+deletions?\(-\)/);
            if (insMatch)
                insertions = parseInt(insMatch[1], 10);
            if (delMatch)
                deletions = parseInt(delMatch[1], 10);
        }
        return {
            commits: commitHash ? 1 : 0,
            files,
            insertions,
            deletions,
        };
    }
    catch {
        return {
            commits: 1,
            files: [],
            insertions: 0,
            deletions: 0,
            warning: "Unable to derive git stats",
        };
    }
}
class GitExecutor {
    async applyDiff(diff) {
        // execSync is imported at top level
        try {
            (0, child_process_1.execSync)("git apply --index", {
                input: diff,
                stdio: "pipe",
            });
        }
        catch (error) {
            throw new Error(`Failed to apply diff: ${error}`);
        }
    }
    async readFile(path) {
        return fs_1.default.promises.readFile(path, "utf-8");
    }
    async writeFile(path, content) {
        await fs_1.default.promises.writeFile(path, content, "utf-8");
    }
    async deleteFile(path) {
        await fs_1.default.promises.unlink(path);
    }
}
function createDiffEditCommand() {
    const program = new commander_1.Command("diff-edit");
    program
        .description("Governed code change CLI - review before executing")
        .version("1.0.0");
    program
        .command("propose <diff-file>")
        .option("-r, --rationale <text>", "Why this change is needed")
        .action(async (diffFile, options) => {
        if (!fs_1.default.existsSync(diffFile)) {
            console.error(chalk_1.default.red(`Diff file not found: ${diffFile}`));
            process.exit(1);
        }
        const diff = fs_1.default.readFileSync(diffFile, "utf-8");
        const rationale = options.rationale || "Manual diff submission";
        const files = (0, diffParser_1.extractFilesFromDiff)(diff);
        const payload = { files, diff };
        const action = CodeChangeAction_1.CodeChangeAction.create(payload, rationale, "cli", "manual-" + Date.now());
        action.propose();
        const actions = (0, store_1.loadActions)();
        actions[action.id] = action;
        (0, store_1.saveActions)(actions);
        console.log(chalk_1.default.green(`[PROPOSED] ${action.id}`));
        console.log(chalk_1.default.cyan("Files:"));
        for (const f of files) {
            console.log(`  - ${chalk_1.default.yellow(f)}`);
        }
        console.log(`\n${chalk_1.default.bold("Rationale:")} ${rationale}`);
    });
    program
        .command("list")
        .description("List all proposed actions")
        .action(() => {
        const actions = (0, store_1.loadActions)();
        console.log(chalk_1.default.bold("\n" + "=".repeat(60)));
        console.log(chalk_1.default.bold("Actions"));
        console.log(chalk_1.default.bold("=".repeat(60)) + "\n");
        const table = [];
        for (const [id, a] of Object.entries(actions)) {
            table.push({
                id,
                kind: a.kind,
                state: a.state,
                rationale: a.rationale.substring(0, 50),
            });
        }
        console.table(table);
    });
    program
        .command("approve <id>")
        .description("Review and approve a proposed action")
        .action(async (id) => {
        const actions = (0, store_1.loadActions)();
        const action = actions[id];
        if (!action) {
            console.error(chalk_1.default.red(`Action not found: ${id}`));
            process.exit(1);
        }
        const files = (0, diffParser_1.parseUnifiedDiff)(action.payload.diff);
        (0, render_1.renderDiffForReview)(files, action.rationale);
        const { level, warnings } = (0, diffParser_1.assessRisk)(files);
        (0, render_1.renderRiskAssessment)(level, warnings);
        const approved = await (0, render_1.promptForApproval)();
        if (!approved) {
            console.log(chalk_1.default.red("\n[REJECTED] Approval aborted"));
            action.state = "REJECTED";
            (0, store_1.saveActions)(actions);
            return;
        }
        action.state = "APPROVED";
        (0, store_1.saveActions)(actions);
        console.log(chalk_1.default.green(`\n[APPROVED] ${id}`));
    });
    program
        .command("exec <id>")
        .description("Execute an approved action")
        .action(async (id) => {
        const actions = (0, store_1.loadActions)();
        const action = actions[id];
        if (!action) {
            console.error(chalk_1.default.red(`Action not found: ${id}`));
            process.exit(1);
        }
        if (action.state !== "APPROVED") {
            console.error(chalk_1.default.red(`Action not approved (state: ${action.state})`));
            process.exit(1);
        }
        console.log(chalk_1.default.cyan(`\n[EXECUTING] ${id}...`));
        const snapshot = (0, sandbox_1.createSnapshot)();
        const executor = new GitExecutor();
        const ctx = { executor, snapshot: snapshot.id };
        try {
            // === PRE-EXEC: Snapshot Validation ===
            await executor.applyDiff(action.payload.diff);
            const changedFiles = (0, sandbox_1.getChangedFiles)();
            (0, sandbox_1.assertNoExtraChanges)(action.payload.files, changedFiles);
            const snapshotResult = {
                changedFiles,
                unexpectedFiles: changedFiles.filter((f) => !action.payload.files.includes(f)),
                matchedBySandbox: changedFiles.length === action.payload.files.length,
            };
            // === EXEC: Commit ===
            (0, sandbox_1.commitChanges)(`EXECUTED action ${id}`, snapshot.id);
            const commitHash = (0, child_process_1.execSync)("git rev-parse HEAD", {
                encoding: "utf-8",
            }).trim();
            action.state = "EXECUTED";
            action.executedAt = Date.now();
            (0, store_1.saveActions)(actions);
            // === POST-EXEC: Reporting ===
            const gitResult = collectGitResult(commitHash);
            console.log(chalk_1.default.green("\n[EXECUTED]"));
            console.log(chalk_1.default.green(`Action ID: ${id}`));
            console.log(chalk_1.default.cyan("\nSnapshot Verification (pre-commit):"));
            console.log(chalk_1.default.cyan(`  - Files changed: ${snapshotResult.changedFiles.length}`));
            for (const f of snapshotResult.changedFiles) {
                console.log(chalk_1.default.cyan(`    - ${f}`));
            }
            if (snapshotResult.unexpectedFiles.length > 0) {
                console.log(chalk_1.default.yellow("  - Unexpected files:"));
                for (const f of snapshotResult.unexpectedFiles) {
                    console.log(chalk_1.default.yellow(`    - ${f}`));
                }
            }
            console.log(chalk_1.default.cyan(`  - Status: ${snapshotResult.matchedBySandbox ? "✅ MATCHED" : "⚠️ DEVIATION"}`));
            console.log(chalk_1.default.cyan("\nGit Result:"));
            console.log(chalk_1.default.cyan(`  - Commit: ${commitHash.substring(0, 7)}`));
            console.log(chalk_1.default.cyan(`  - Files changed: ${gitResult.files.length}`));
            console.log(chalk_1.default.cyan(`  - Insertions: ${gitResult.insertions}`));
            console.log(chalk_1.default.cyan(`  - Deletions: ${gitResult.deletions}`));
            console.log(chalk_1.default.green("\nStatus:"));
            console.log(chalk_1.default.green("  ✅ EXECUTED (validated + committed)"));
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n[FAILED] ${error}`));
            console.log(chalk_1.default.yellow("\nRolling back to snapshot..."));
            (0, sandbox_1.rollbackToSnapshot)(snapshot.id);
            action.state = "REJECTED";
            (0, store_1.saveActions)(actions);
            console.log(chalk_1.default.cyan("\nRolled back successfully"));
            process.exit(1);
        }
    });
    program
        .command("status <id>")
        .description("Show status of an action")
        .action((id) => {
        const actions = (0, store_1.loadActions)();
        const action = actions[id];
        if (!action) {
            console.error(chalk_1.default.red(`Action not found: ${id}`));
            process.exit(1);
        }
        console.log(chalk_1.default.bold("\n" + "=".repeat(60)));
        console.log(chalk_1.default.bold(`Action: ${id}`));
        console.log(chalk_1.default.bold("=".repeat(60)) + "\n");
        console.log(`${chalk_1.default.bold("Kind:")} ${action.kind}`);
        console.log(`${chalk_1.default.bold("State:")} ${action.state}`);
        console.log(`${chalk_1.default.bold("Rationale:")} ${action.rationale}`);
        console.log(`${chalk_1.default.bold("Updated:")} ${new Date(action.updatedAt).toLocaleString()}`);
        if (action.state === "EXECUTED" && action.executedAt) {
            console.log(`${chalk_1.default.bold("Executed:")} ${new Date(action.executedAt).toLocaleString()}`);
        }
    });
    return program;
}
//# sourceMappingURL=diffEdit.js.map