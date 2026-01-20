import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";

import { GovernanceEngine } from "../GovernanceEngine";
import { CodeChangeAction, CodeChangePayload } from "../actions/CodeChangeAction";
import { ExecutionContext, ActionExecutor } from "../GovernedAction";
import { parseUnifiedDiff, extractFilesFromDiff, assessRisk } from "../review/diffParser";
import { renderSummary, renderDiffForReview, renderRiskAssessment, promptForApproval } from "../review/render";
import { createSnapshot, rollbackToSnapshot, commitChanges, assertNoExtraChanges, getChangedFiles } from "../execution/sandbox";
import { issue } from "../capability/token";
import { loadActions, saveActions, auditActions } from "../storage/store";

const engine = new GovernanceEngine();
auditActions(loadActions());

class GitExecutor implements ActionExecutor {
  async applyDiff(diff: string): Promise<void> {
    const { execSync } = require("child_process");

    try {
      execSync("git apply --index", {
        input: diff,
        stdio: "pipe",
      });
    } catch (error) {
      throw new Error(`Failed to apply diff: ${error}`);
    }
  }

  async readFile(path: string): Promise<string> {
    return fs.promises.readFile(path, "utf-8");
  }

  async writeFile(path: string, content: string): Promise<void> {
    await fs.promises.writeFile(path, content, "utf-8");
  }

  async deleteFile(path: string): Promise<void> {
    await fs.promises.unlink(path);
  }
}

export function createDiffEditCommand(): Command {
  const program = new Command("diff-edit");

  program
    .description("Governed code change CLI - review before executing")
    .version("1.0.0");

  program
    .command("propose <diff-file>")
    .option("-r, --rationale <text>", "Why this change is needed")
    .action(async (diffFile, options) => {
      if (!fs.existsSync(diffFile)) {
        console.error(chalk.red(`Diff file not found: ${diffFile}`));
        process.exit(1);
      }

      const diff = fs.readFileSync(diffFile, "utf-8");
      const rationale = options.rationale || "Manual diff submission";

      const files = extractFilesFromDiff(diff);
      const payload: CodeChangePayload = { files, diff };

      const action = CodeChangeAction.create(
        payload,
        rationale,
        "cli",
        "manual-" + Date.now()
      );

      action.propose();

      const actions = loadActions();
      actions[action.id] = action as any;
      saveActions(actions);

      console.log(chalk.green(`[PROPOSED] ${action.id}`));
      console.log(chalk.cyan("Files:"));
      for (const f of files) {
        console.log(`  - ${chalk.yellow(f)}`);
      }

      console.log(`\n${chalk.bold("Rationale:")} ${rationale}`);
    });

  program
    .command("list")
    .description("List all proposed actions")
    .action(() => {
      const actions = loadActions();

      console.log(chalk.bold("\n" + "=".repeat(60)));
      console.log(chalk.bold("Actions"));
      console.log(chalk.bold("=".repeat(60)) + "\n");

      const table: Array<{
        id: string;
        kind: string;
        state: string;
        rationale: string;
      }> = [];

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
      const actions = loadActions();
      const action = actions[id];

      if (!action) {
        console.error(chalk.red(`Action not found: ${id}`));
        process.exit(1);
      }

      const files = parseUnifiedDiff(action.payload.diff);
      renderDiffForReview(files, action.rationale);

      const { level, warnings } = assessRisk(files);
      renderRiskAssessment(level, warnings);

      const approved = await promptForApproval();

      if (!approved) {
        console.log(chalk.red("\n[REJECTED] Approval aborted"));
        action.state = "REJECTED";
        saveActions(actions);
        return;
      }

      action.state = "APPROVED";
      saveActions(actions);

      console.log(chalk.green(`\n[APPROVED] ${id}`));
    });

  program
    .command("exec <id>")
    .description("Execute an approved action")
    .action(async (id) => {
      const actions = loadActions();
      const action = actions[id];

      if (!action) {
        console.error(chalk.red(`Action not found: ${id}`));
        process.exit(1);
      }

      if (action.state !== "APPROVED") {
        console.error(
          chalk.red(
            `Action not approved (state: ${action.state})`
          )
        );
        process.exit(1);
      }

      console.log(chalk.cyan(`\n[EXECUTING] ${id}...`));

      const snapshot = createSnapshot();
      const executor = new GitExecutor();
      const ctx: ExecutionContext = { executor, snapshot: snapshot.id };

      try {
        await executor.applyDiff(action.payload.diff);

        const changedFiles = getChangedFiles();
        assertNoExtraChanges(action.payload.files, changedFiles);

        commitChanges(`EXECUTED action ${id}`, snapshot.id);

        action.state = "EXECUTED";
        action.executedAt = Date.now();
        saveActions(actions);

        console.log(chalk.green(`\n[EXECUTED] ${id}`));
        console.log(chalk.cyan(`Files changed: ${changedFiles.length}`));
      } catch (error) {
        console.error(chalk.red(`\n[FAILED] ${error}`));

        console.log(chalk.yellow("\nRolling back to snapshot..."));
        rollbackToSnapshot(snapshot.id);

        action.state = "REJECTED";
        saveActions(actions);

        console.log(chalk.cyan("\nRolled back successfully"));
        process.exit(1);
      }
    });

  program
    .command("status <id>")
    .description("Show status of an action")
    .action((id) => {
      const actions = loadActions();
      const action = actions[id];

      if (!action) {
        console.error(chalk.red(`Action not found: ${id}`));
        process.exit(1);
      }

      console.log(chalk.bold("\n" + "=".repeat(60)));
      console.log(chalk.bold(`Action: ${id}`));
      console.log(chalk.bold("=".repeat(60)) + "\n");

      console.log(`${chalk.bold("Kind:")} ${action.kind}`);
      console.log(`${chalk.bold("State:")} ${action.state}`);
      console.log(`${chalk.bold("Rationale:")} ${action.rationale}`);
      console.log(
        `${chalk.bold("Updated:")} ${new Date(
          action.updatedAt
        ).toLocaleString()}`
      );

      if (action.state === "EXECUTED" && action.executedAt) {
        console.log(
          `${chalk.bold("Executed:")} ${new Date(
            action.executedAt
          ).toLocaleString()}`
        );
      }
    });

  return program;
}
