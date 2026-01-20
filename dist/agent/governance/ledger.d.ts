import { RiskEntry } from './core';
export declare class RiskLedger {
    private entries;
    record(actionType: string): void;
    getSnapshot(): RiskEntry[];
}
