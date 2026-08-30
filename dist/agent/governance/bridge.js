"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WasmGovernanceBridge = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class WasmGovernanceBridge {
    static instance = null;
    static async init() {
        try {
            const loader = require('@assemblyscript/loader');
            const wasmPath = path_1.default.join(process.cwd(), 'build', 'release.wasm');
            if (!fs_1.default.existsSync(wasmPath)) {
                // P2 清理：显式降级——WASM 沙箱产物未构建时回退到逻辑层策略，不再静默忽略
                console.log('📋 WASM 治理沙箱未启用（build/release.wasm 缺失），回退到逻辑层策略');
                return false;
            }
            const wasmModule = await loader.instantiate(fs_1.default.readFileSync(wasmPath));
            this.instance = wasmModule.exports;
            return true;
        }
        catch {
            return false;
        }
    }
    /** 测试用：重置单例，便于 afterEach 清理 */
    static resetForTesting() {
        this.instance = null;
    }
    static evaluate(proposal, rules, ledger) {
        if (!this.instance)
            return { effect: 'error', reason: 'WASM not initialized' };
        const { __newString, __getString, evaluate } = this.instance;
        const pPtr = __newString(JSON.stringify(proposal));
        const rPtr = __newString(JSON.stringify(rules));
        const lPtr = __newString(JSON.stringify(ledger));
        const resultPtr = evaluate(pPtr, rPtr, lPtr);
        return JSON.parse(__getString(resultPtr));
    }
}
exports.WasmGovernanceBridge = WasmGovernanceBridge;
//# sourceMappingURL=bridge.js.map