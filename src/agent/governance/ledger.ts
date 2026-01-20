import { RiskEntry } from './core';

export class RiskLedger {
    private entries: RiskEntry[] = [];

    record(actionType: string): void {
        this.entries.push({
            ts: Date.now(),
            actionType
        });
        this.cleanup();
    }

    getSnapshot(): RiskEntry[] {
        return [...this.entries];
    }

    private cleanup(): void {
        const oneHourAgo = Date.now() - 3600000;
        this.entries = this.entries.filter(e => e.ts > oneHourAgo);
    }
}
