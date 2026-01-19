export type Capability = 'read:workspace' | 'write:workspace' | 'run:shell' | 'read:config' | 'write:config' | 'network:http' | 'secret:use' | 'secret:read' | string;
export type MacroState = 'draft' | 'approved' | 'deprecated';
export interface MacroDependency {
    macro: string;
    version: string;
    mode: 'inline' | 'isolated';
}
export interface MacroManifest {
    id: string;
    version: string;
    description: string;
    author: string;
    createdAt: number;
    updatedAt?: number;
    requires: Capability[];
    inputs?: Record<string, any>;
    checksum: string;
    state: MacroState;
    dependsOn?: MacroDependency[];
    tags?: string[];
    previousChecksum?: string;
}
export interface MacroPublishOptions {
    autoApprove?: boolean;
    skipCapabilityCheck?: boolean;
}
export interface MacroDiffResult {
    hasChanges: boolean;
    capabilityDiff: {
        added: Capability[];
        removed: Capability[];
        unchanged: Capability[];
    };
    requiresApproval: boolean;
    reason?: string;
}
export interface MacroRegistryConfig {
    storagePath: string;
    autoApproveSafe: boolean;
    maxRiskLevel: 'low' | 'medium' | 'high';
}
export declare function calculateChecksum(manifest: Omit<MacroManifest, 'checksum'>): string;
export declare function validateManifest(manifest: any): manifest is MacroManifest;
