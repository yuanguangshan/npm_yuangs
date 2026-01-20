export type Right = {
    type: "APPLY_DIFF";
} | {
    type: "READ_FILE";
    path: string;
} | {
    type: "EXECUTE_ACTION";
    actionId: string;
};
export type Scope = {
    type: "ACTION";
    id: string;
} | {
    type: "PATH_PREFIX";
    prefix: string;
} | {
    type: "REPO";
};
export interface Capability {
    id: string;
    subject: string;
    rights: Right[];
    scope: Scope;
    issuedAt: number;
    expiresAt: number;
    maxUses: number;
    used: number;
    signature: string;
}
export declare function sign(data: string): string;
export declare function verify(cap: Capability): boolean;
export declare function issue(input: {
    subject: string;
    rights: Right[];
    scope: Scope;
    ttlMs: number;
    maxUses?: number;
}): Capability;
export declare function checkCapability(cap: Capability, want: Right, context: {
    actionId?: string;
    path?: string;
}): void;
export declare function attenuate(cap: Capability, limits: Partial<Pick<Capability, "expiresAt" | "maxUses">>): Capability;
export declare function revoke(capId: string): void;
export declare function checkRevoked(cap: Capability): void;
