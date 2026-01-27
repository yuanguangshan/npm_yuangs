"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleSupervisorActionLogger = void 0;
/**
 * 控制台日志记录器实现
 */
class ConsoleSupervisorActionLogger {
    log(event) {
        // 生产环境下可对接 ELK / Sentry / OTEL
        console.log(chalk_1.default.bold.magenta('\n📡 [Supervisor Event Recorded]'));
        console.log(JSON.stringify(event, null, 2));
    }
}
exports.ConsoleSupervisorActionLogger = ConsoleSupervisorActionLogger;
const chalk_1 = __importDefault(require("chalk"));
//# sourceMappingURL=SupervisorActionLog.js.map