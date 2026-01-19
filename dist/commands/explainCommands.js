"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerExplainCommands = registerExplainCommands;
const chalk_1 = __importDefault(require("chalk"));
const explain_1 = require("../core/explain");
const executionStore_1 = require("../core/executionStore");
function registerExplainCommands(program) {
    program
        .command('explain [id]')
        .description('Explain an execution (use "last" for most recent)')
        .action((id) => {
        let record;
        if (!id || id === 'last') {
            const records = (0, executionStore_1.listExecutionRecords)(1);
            if (records.length === 0) {
                console.log(chalk_1.default.red('❌ No execution records found\n'));
                return;
            }
            record = records[0];
            console.log(chalk_1.default.gray(`Showing most recent execution: ${record.id}\n`));
        }
        else {
            record = (0, executionStore_1.loadExecutionRecord)(id);
            if (!record) {
                console.log(chalk_1.default.red(`❌ Execution record "${id}" not found\n`));
                return;
            }
        }
        const explanation = (0, explain_1.explainExecution)(record);
        console.log(explanation);
    });
}
//# sourceMappingURL=explainCommands.js.map