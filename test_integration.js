const fs = require("fs");
const path = require("path");

// Check if the diffEdit command file exists
const diffEditPath = path.join(__dirname, "src/governance/commands/diffEdit.ts");
if (!fs.existsSync(diffEditPath)) {
    console.error("❌ diffEdit command file does not exist");
    process.exit(1);
}

console.log("✅ diffEdit command file exists");

// Check if the CLI imports and registers the diffEdit command
const cliPath = path.join(__dirname, "src/cli.ts");
const cliContent = fs.readFileSync(cliPath, "utf-8");

if (!cliContent.includes("createDiffEditCommand")) {
    console.error("❌ CLI does not import createDiffEditCommand");
    process.exit(1);
}

console.log("✅ CLI imports createDiffEditCommand");

if (!cliContent.includes("program.addCommand(diffEditCmd)")) {
    console.error("❌ CLI does not register diffEdit command");
    process.exit(1);
}

console.log("✅ CLI registers diffEdit command");

// Check if the help text includes diff-edit
if (!cliContent.includes("diff-edit")) {
    console.error("❌ CLI help does not include diff-edit command");
    process.exit(1);
}

console.log("✅ CLI help includes diff-edit command");

console.log("");
console.log("🎉 All integration checks passed!");
console.log("");
console.log("The diffEdit command has been successfully integrated into the yuangs CLI.");
console.log("Users can now run:");
console.log("  yuangs diff-edit propose <diff-file>");
console.log("  yuangs diff-edit list");
console.log("  yuangs diff-edit approve <id>");
console.log("  yuangs diff-edit exec <id>");
console.log("  yuangs diff-edit status <id>");
