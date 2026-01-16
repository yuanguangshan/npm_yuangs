"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirm = confirm;
const readline_1 = __importDefault(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
async function confirm(message) {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(chalk_1.default.yellow(`\n⚠️  ${message} (y/N) `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}
//# sourceMappingURL=confirm.js.map