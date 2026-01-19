"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskExplainer = void 0;
exports.createCapabilityGraph = createCapabilityGraph;
function createCapabilityGraph() {
    const nodes = new Map();
    nodes.set('read:workspace', {
        id: 'read:workspace',
        risk: 'low',
        description: 'Read files from the workspace',
        implies: ['read:config']
    });
    nodes.set('write:workspace', {
        id: 'write:workspace',
        risk: 'high',
        description: 'Write files to the workspace',
        implies: ['read:workspace', 'write:config']
    });
    nodes.set('run:shell', {
        id: 'run:shell',
        risk: 'high',
        description: 'Execute shell commands',
        implies: ['read:workspace', 'write:workspace']
    });
    nodes.set('read:config', {
        id: 'read:config',
        risk: 'low',
        description: 'Read configuration files'
    });
    nodes.set('write:config', {
        id: 'write:config',
        risk: 'medium',
        description: 'Write configuration files'
    });
    nodes.set('network:http', {
        id: 'network:http',
        risk: 'medium',
        description: 'Make HTTP requests'
    });
    nodes.set('secret:use', {
        id: 'secret:use',
        risk: 'high',
        description: 'Access secrets (without reading values)'
    });
    nodes.set('secret:read', {
        id: 'secret:read',
        risk: 'high',
        description: 'Read secret values'
    });
    return {
        nodes,
        version: '1.0.0'
    };
}
class RiskExplainer {
    graph;
    highRiskPatterns;
    constructor(graph) {
        this.graph = graph || createCapabilityGraph();
        this.highRiskPatterns = [
            /rm\s+-rf/i,
            />\s*\/dev\/null/,
            /dd\s+if=/,
            /sudo\s+rm/
        ];
    }
    explainRisk(manifest) {
        const factors = [];
        for (const cap of manifest.requires) {
            const capRisk = this.assessCapability(cap);
            factors.push(...capRisk);
        }
        if (manifest.tags?.includes('destructive')) {
            factors.push({
                type: 'destructive',
                severity: 'high',
                description: 'Macro is tagged as destructive',
                suggestion: 'Requires manual approval from a senior developer'
            });
        }
        if (manifest.dependsOn && manifest.dependsOn.length > 0) {
            factors.push({
                type: 'dependency',
                severity: 'medium',
                description: `Depends on ${manifest.dependsOn.length} external macro(s)`,
                suggestion: 'Review dependency chain for transitive capabilities'
            });
        }
        const overallRisk = this.calculateOverallRisk(factors);
        const score = this.riskToScore(overallRisk);
        const requiresApproval = overallRisk !== 'low';
        return {
            overallRisk,
            score,
            factors,
            requiresApproval,
            explanation: this.generateExplanation(manifest, overallRisk, factors)
        };
    }
    expandCapabilities(capabilities) {
        const expanded = new Set();
        const stack = [...capabilities];
        while (stack.length > 0) {
            const cap = stack.pop();
            if (expanded.has(cap))
                continue;
            expanded.add(cap);
            const node = this.graph.nodes.get(cap);
            if (node?.implies) {
                stack.push(...node.implies);
            }
        }
        return Array.from(expanded);
    }
    explainCapability(capability) {
        const node = this.graph.nodes.get(capability);
        if (!node) {
            return `Unknown capability: ${capability}`;
        }
        let explanation = `${node.description} (Risk: ${node.risk.toUpperCase()})`;
        if (node.implies && node.implies.length > 0) {
            explanation += `\n  Implies: ${node.implies.join(', ')}`;
        }
        return explanation;
    }
    assessCapability(capability) {
        const factors = [];
        const node = this.graph.nodes.get(capability);
        if (!node) {
            factors.push({
                type: 'capability',
                severity: 'medium',
                description: `Unknown capability: ${capability}`,
                capability,
                suggestion: 'Define this capability in the graph'
            });
            return factors;
        }
        if (node.risk === 'high') {
            factors.push({
                type: 'capability',
                severity: 'high',
                description: `High-risk capability: ${capability}`,
                capability,
                suggestion: 'Ensure this capability is absolutely necessary'
            });
        }
        if (capability.includes('shell')) {
            factors.push({
                type: 'capability',
                severity: 'high',
                description: 'Shell execution capability - can run arbitrary commands',
                capability,
                suggestion: 'Review all shell commands carefully'
            });
        }
        if (capability.includes('secret')) {
            factors.push({
                type: 'secret',
                severity: 'high',
                description: 'Access to secrets',
                capability,
                suggestion: 'Ensure secrets are scoped properly'
            });
        }
        return factors;
    }
    calculateOverallRisk(factors) {
        if (factors.some(f => f.severity === 'high')) {
            return 'high';
        }
        if (factors.some(f => f.severity === 'medium')) {
            return 'medium';
        }
        return 'low';
    }
    riskToScore(risk) {
        switch (risk) {
            case 'low': return 1;
            case 'medium': return 5;
            case 'high': return 10;
        }
    }
    generateExplanation(manifest, risk, factors) {
        let explanation = `Macro "${manifest.id}@${manifest.version}" has ${risk.toUpperCase()} risk.\n\n`;
        explanation += `Required capabilities (${manifest.requires.length}):\n`;
        for (const cap of manifest.requires) {
            explanation += `  - ${this.explainCapability(cap)}\n`;
        }
        if (factors.length > 0) {
            explanation += `\nRisk factors:\n`;
            for (const factor of factors) {
                explanation += `  [${factor.severity.toUpperCase()}] ${factor.description}\n`;
                if (factor.suggestion) {
                    explanation += `      → ${factor.suggestion}\n`;
                }
            }
        }
        explanation += `\n`;
        if (risk === 'high') {
            explanation += '⚠️  This macro requires manual approval before execution.\n';
            explanation += 'Review the capabilities and ensure you understand the impact.\n';
        }
        else if (risk === 'medium') {
            explanation += '⚠️  This macro has moderate risk. Consider the implications carefully.\n';
        }
        else {
            explanation += '✅ This macro has low risk and can be auto-approved.\n';
        }
        return explanation;
    }
}
exports.RiskExplainer = RiskExplainer;
//# sourceMappingURL=explainer.js.map