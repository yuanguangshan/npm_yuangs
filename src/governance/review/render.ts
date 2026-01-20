import chalk from "chalk";
import { DiffFile } from "./diffParser";

export function renderSummary(files: DiffFile[]): void {
  console.log(chalk.bold("\nDiff Summary\n"));

  for (const f of files) {
    console.log(
      `${chalk.cyan(f.file)}  ` +
        chalk.green(`+${f.additions}`) +
        " " +
        chalk.red(`-${f.deletions}`)
    );
  }
}

export function renderDiffForReview(
  files: DiffFile[],
  rationale: string
): void {
  console.log(
    chalk.bold.cyan("=".repeat(60))
  );
  console.log(chalk.bold.blue("Proposed Code Change"));
  console.log(
    chalk.bold.cyan("=".repeat(60))
  );

  console.log(`${chalk.bold("Rationale:")} ${rationale}\n`);

  for (const f of files) {
    console.log(chalk.yellow(`\n📄 ${f.file}`));
    console.log(
      `   ${chalk.green("+")} ${f.additions} lines added`
    );
    console.log(
      `   ${chalk.red("-")} ${f.deletions} lines deleted`
    );
  }

  console.log(
    chalk.bold.cyan("\n" + "=".repeat(60))
  );
}

export function renderRiskAssessment(
  level: "low" | "medium" | "high",
  warnings: string[]
): void {
  const levelColor = {
    low: chalk.green,
    medium: chalk.yellow,
    high: chalk.red,
  };

  console.log(
    chalk.bold(
      `\n${levelColor[level]}(\u26a0\ufe0f  Risk Level: ${level.toUpperCase()})`
    )
  );

  if (warnings.length > 0) {
    for (const w of warnings) {
      console.log(chalk.yellow(`   - ${w}`));
    }
  }
}

export function promptForApproval(): Promise<boolean> {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.bold.yellow('\nType "YES" to approve, anything else to reject: '),
      (answer: string) => {
        rl.close();
        resolve(answer.trim() === "YES");
      }
    );
  });
}
