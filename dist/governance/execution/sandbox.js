"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSnapshot = createSnapshot;
exports.verifySnapshot = verifySnapshot;
exports.rollbackToSnapshot = rollbackToSnapshot;
exports.commitChanges = commitChanges;
exports.getChangedFiles = getChangedFiles;
exports.assertNoExtraChanges = assertNoExtraChanges;
const child_process_1 = require("child_process");
function createSnapshot() {
    const statusOutput = (0, child_process_1.execSync)("git status --porcelain", {
        encoding: "utf-8",
    }).trim();
    const isClean = statusOutput.length === 0;
    if (!isClean) {
        throw new Error("Cannot create snapshot: working tree is dirty. Commit or stash changes first.");
    }
    const commitHash = (0, child_process_1.execSync)("git rev-parse HEAD", {
        encoding: "utf-8",
    }).trim();
    return {
        id: commitHash,
        commitHash,
        timestamp: Date.now(),
        isClean,
    };
}
function verifySnapshot(snapshotId) {
    try {
        const current = (0, child_process_1.execSync)("git rev-parse HEAD", {
            encoding: "utf-8",
        }).trim();
        return current === snapshotId;
    }
    catch {
        return false;
    }
}
function rollbackToSnapshot(snapshotId) {
    try {
        (0, child_process_1.execSync)(`git reset --hard ${snapshotId}`, {
            stdio: "inherit",
        });
        console.log(`Rolled back to snapshot ${snapshotId}`);
    }
    catch (error) {
        throw new Error(`Failed to rollback to snapshot ${snapshotId}: ${error}`);
    }
}
function commitChanges(message, snapshotId) {
    try {
        (0, child_process_1.execSync)(`git commit -am "${message}"`, {
            stdio: "inherit",
        });
    }
    catch (error) {
        throw new Error(`Failed to commit changes: ${error}`);
    }
}
function getChangedFiles() {
    const output = (0, child_process_1.execSync)("git diff --name-only", {
        encoding: "utf-8",
    });
    return output
        .trim()
        .split("\n")
        .filter((f) => f.length > 0);
}
function assertNoExtraChanges(approvedFiles, actualFiles) {
    const approvedSet = new Set(approvedFiles);
    const extraFiles = actualFiles.filter((f) => !approvedSet.has(f));
    if (extraFiles.length > 0) {
        throw new Error(`Governance violation: execution modified undeclared files:\n${extraFiles.join("\n")}`);
    }
}
//# sourceMappingURL=sandbox.js.map