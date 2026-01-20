export declare class WasmGovernanceBridge {
    private static instance;
    static init(): Promise<boolean>;
    static evaluate(proposal: any, rules: any, ledger: any): any;
}
