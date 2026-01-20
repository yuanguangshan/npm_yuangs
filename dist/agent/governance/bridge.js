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
                return false;
            }
            const wasmModule = await loader.instantiate(fs_1.default.readFileSync(wasmPath));
            this.instance = wasmModule.exports;
            return true;
        }
        catch (e) {
            return false;
        }
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