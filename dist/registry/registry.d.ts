import type { MacroManifest, MacroState, MacroPublishOptions, MacroDiffResult, MacroRegistryConfig } from './manifest';
export declare class MacroRegistry {
    private config;
    private manifests;
    constructor(config?: Partial<MacroRegistryConfig>);
    initialize(): Promise<void>;
    publish(manifest: Omit<MacroManifest, 'checksum'>, options?: MacroPublishOptions): Promise<MacroManifest>;
    get(macroId: string, version?: string): Promise<MacroManifest | null>;
    list(filters?: {
        state?: MacroState;
        author?: string;
        tags?: string[];
    }): Promise<MacroManifest[]>;
    approve(macroId: string, version: string, approvedBy: string): Promise<MacroManifest>;
    deprecate(macroId: string, version?: string): Promise<MacroManifest>;
    compareCapabilities(oldManifest: MacroManifest, newManifest: MacroManifest): MacroDiffResult;
    getVersions(macroId: string): Promise<MacroManifest[]>;
    private loadFromDisk;
    private saveToDisk;
}
