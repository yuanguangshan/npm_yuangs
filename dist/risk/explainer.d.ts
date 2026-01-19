import type { Capability, MacroManifest } from '../registry/manifest';
export type RiskLevel = 'low' | 'medium' | 'high';
export interface RiskAssessment {
    overallRisk: RiskLevel;
    score: number;
    factors: RiskFactor[];
    requiresApproval: boolean;
    explanation: string;
}
export interface RiskFactor {
    type: 'capability' | 'destructive' | 'dependency' | 'network' | 'secret';
    severity: RiskLevel;
    description: string;
    capability?: string;
    suggestion?: string;
}
export interface CapabilityNode {
    id: Capability;
    risk: RiskLevel;
    description: string;
    implies?: Capability[];
}
export interface CapabilityGraph {
    nodes: Map<Capability, CapabilityNode>;
    version: string;
}
export declare function createCapabilityGraph(): CapabilityGraph;
export declare class RiskExplainer {
    private graph;
    private highRiskPatterns;
    constructor(graph?: CapabilityGraph);
    explainRisk(manifest: MacroManifest): RiskAssessment;
    expandCapabilities(capabilities: Capability[]): Capability[];
    explainCapability(capability: Capability): string;
    private assessCapability;
    private calculateOverallRisk;
    private riskToScore;
    private generateExplanation;
}
