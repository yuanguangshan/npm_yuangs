import type { MacroManifest, MacroPublishOptions, Capability } from '../registry/manifest';
import type { RiskAssessment } from '../risk/explainer';
export declare class RegistryAPI {
    private registry;
    private riskExplainer;
    constructor(storagePath?: string);
    initialize(): Promise<void>;
    publishMacro(id: string, version: string, description: string, requires: Capability[], author: string, options?: MacroPublishOptions): Promise<MacroManifest>;
    getMacro(id: string, version?: string): Promise<MacroManifest | null>;
    listMacros(filters?: {
        state?: 'draft' | 'approved' | 'deprecated';
        author?: string;
        tags?: string[];
    }): Promise<MacroManifest[]>;
    approveMacro(id: string, version: string, approvedBy: string): Promise<MacroManifest>;
    deprecateMacro(id: string, version?: string): Promise<MacroManifest>;
    assessMacroRisk(id: string, version?: string): Promise<RiskAssessment | null>;
    compareMacroVersions(id: string, oldVersion: string, newVersion: string): Promise<import("../registry/manifest").MacroDiffResult>;
    getMacroVersions(id: string): Promise<MacroManifest[]>;
    explainCapability(capability: Capability): Promise<string>;
    expandCapabilities(capabilities: Capability[]): Promise<Capability[]>;
}
