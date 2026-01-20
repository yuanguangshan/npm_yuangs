"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUnifiedDiff = parseUnifiedDiff;
exports.extractFilesFromDiff = extractFilesFromDiff;
exports.assessRisk = assessRisk;
function parseUnifiedDiff(diff) {
    const files = [];
    let current = null;
    for (const line of diff.split("\n")) {
        if (line.startsWith("diff --git")) {
            if (current) {
                files.push(current);
            }
            const match = line.match(/b\/(.+)$/);
            const file = match ? match[1] : "unknown";
            current = { file, additions: 0, deletions: 0, hunks: [] };
        }
        else if (!current) {
            continue;
        }
        else if (line.startsWith("+") && !line.startsWith("+++")) {
            current.additions++;
        }
        else if (line.startsWith("-") && !line.startsWith("---")) {
            current.deletions++;
        }
        else if (line.startsWith("@@")) {
            current.hunks.push(line);
        }
    }
    if (current) {
        files.push(current);
    }
    return files;
}
function extractFilesFromDiff(diff) {
    const files = [];
    const filePattern = /^\+\+\+ b\/(.+)$/gm;
    for (const match of diff.matchAll(filePattern)) {
        files.push(match[1]);
    }
    return files;
}
function assessRisk(files) {
    const warnings = [];
    const totalLines = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);
    if (totalLines > 300) {
        warnings.push(`Large changeset: ${totalLines} lines`);
    }
    if (files.length > 10) {
        warnings.push(`Many files touched: ${files.length}`);
    }
    if (totalLines > 1000) {
        return { level: "high", warnings };
    }
    if (totalLines > 300 || files.length > 10) {
        return { level: "medium", warnings };
    }
    return { level: "low", warnings };
}
//# sourceMappingURL=diffParser.js.map