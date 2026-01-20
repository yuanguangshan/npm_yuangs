export declare class WasmGovernanceBridge {
    private wasmInstance;
    init(): Promise<void>;
    evaluate(action: any, rules: any[], ledger: any[]): {
        effect: string;
        reason?: string;
    };
}
