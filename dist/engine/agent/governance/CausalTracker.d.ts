export declare class CausalTracker {
    static recordCausalLink(obsId: string, executionId: string, ackText: string): void;
    private static verifyAck;
}
