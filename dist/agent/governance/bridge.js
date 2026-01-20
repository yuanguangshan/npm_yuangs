"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WasmGovernanceBridge = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loader_1 = __importDefault(require("@assemblyscript/loader"));
class WasmGovernanceBridge {
    wasmInstance = null;
    async init() {
        const wasmPath = path_1.default.join(process.cwd(), 'build/governance.release.wasm');
        if (!fs_1.default.existsSync(wasmPath)) {
            // 如果不存在，尝试加载 debug 版本作为兜底（或者报错提示用户编译）
            const debugPath = path_1.default.join(process.cwd(), 'build/governance.debug.wasm');
            if (!fs_1.default.existsSync(debugPath)) {
                throw new Error(`WASM 模块未找到，请先运行 npm run asbuild. 路径: ${wasmPath}`);
            }
            this.wasmInstance = await loader_1.default.instantiate(fs_1.default.readFileSync(debugPath), {});
        }
        else {
            const wasmModule = fs_1.default.readFileSync(wasmPath);
            // 实例化 WASM，并注入必要的运行时支持
            this.wasmInstance = await loader_1.default.instantiate(wasmModule, {});
        }
        console.log('✅ WASM 治理沙盒已加载并激活。');
    }
    evaluate(action, rules, ledger) {
        if (!this.wasmInstance)
            throw new Error("WASM 沙盒未初始化");
        const { __newString, __getString, evaluate } = this.wasmInstance.exports;
        // 将数据封箱送入沙盒内存
        const proposalPtr = __newString(JSON.stringify(action));
        const rulesPtr = __newString(JSON.stringify(rules));
        const ledgerPtr = __newString(JSON.stringify(ledger));
        // 在沙盒内执行计算
        const resultPtr = evaluate(proposalPtr, rulesPtr, ledgerPtr);
        // 从沙盒提取计算结果
        const resultJson = __getString(resultPtr);
        return JSON.parse(resultJson);
    }
}
exports.WasmGovernanceBridge = WasmGovernanceBridge;
//# sourceMappingURL=bridge.js.map