import fs from 'fs';
import path from 'path';

export interface GovernanceProposal { id?: string; type?: string; payload?: unknown; [k: string]: unknown; }
export interface GovernanceRule { id: string; effect: string; reason?: string; [k: string]: unknown; }
export type GovernanceLedger = unknown[];
export interface GovernanceResult { effect: string; reason: string; [k: string]: unknown; }
interface WasmExports { __newString: (s: string) => number; __getString: (ptr: number) => string; evaluate: (a: number, b: number, c: number) => number; }

export class WasmGovernanceBridge {
    private static instance: WasmExports | null = null;

    static async init(): Promise<boolean> {
        try {
            const loader = require('@assemblyscript/loader');
            const wasmPath = path.join(process.cwd(), 'build', 'release.wasm');

            if (!fs.existsSync(wasmPath)) {
                return false;
            }

            const wasmModule = await loader.instantiate(fs.readFileSync(wasmPath));
            this.instance = wasmModule.exports as unknown as WasmExports;
            return true;
        } catch {
            return false;
        }
    }

    /** 测试用：重置单例，便于 afterEach 清理 */
    static resetForTesting(): void {
        this.instance = null;
    }

    static evaluate(proposal: unknown, rules: unknown, ledger: unknown): GovernanceResult {
        if (!this.instance) return { effect: 'error', reason: 'WASM not initialized' };

        const { __newString, __getString, evaluate } = this.instance;

        const pPtr = __newString(JSON.stringify(proposal));
        const rPtr = __newString(JSON.stringify(rules));
        const lPtr = __newString(JSON.stringify(ledger));

        const resultPtr = evaluate(pPtr, rPtr, lPtr);
        return JSON.parse(__getString(resultPtr));
    }
}
