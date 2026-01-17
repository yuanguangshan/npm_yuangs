"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = exec;
const child_process_1 = require("child_process");
async function exec(command) {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        // Use user's preferred shell back with full support for their environment
        const shell = process.env.SHELL || true;
        const child = (0, child_process_1.spawn)(command, [], { shell });
        child.stdout.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(data);
        });
        child.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });
        child.on('close', (code) => {
            resolve({ stdout, stderr, code });
        });
        child.on('error', (err) => {
            stderr += err.message;
            resolve({ stdout, stderr, code: 1 });
        });
    });
}
//# sourceMappingURL=executor.js.map