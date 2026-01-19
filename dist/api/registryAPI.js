"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryAPI = void 0;
const registry_1 = require("../registry/registry");
const explainer_1 = require("../risk/explainer");
class RegistryAPI {
    registry;
    riskExplainer;
    constructor(storagePath) {
        this.registry = new registry_1.MacroRegistry({ storagePath });
        this.riskExplainer = new explainer_1.RiskExplainer((0, explainer_1.createCapabilityGraph)());
    }
    async initialize() {
        await this.registry.initialize();
    }
    async publishMacro(id, version, description, requires, author, options = {}) {
        const manifest = {
            id,
            version,
            description,
            author,
            createdAt: Date.now(),
            state: 'draft',
            requires
        };
        return await this.registry.publish(manifest, options);
    }
    async getMacro(id, version) {
        return await this.registry.get(id, version);
    }
    async listMacros(filters) {
        return await this.registry.list(filters);
    }
    async approveMacro(id, version, approvedBy) {
        return await this.registry.approve(id, version, approvedBy);
    }
    async deprecateMacro(id, version) {
        return await this.registry.deprecate(id, version);
    }
    async assessMacroRisk(id, version) {
        const manifest = await this.registry.get(id, version);
        if (!manifest) {
            return null;
        }
        return this.riskExplainer.explainRisk(manifest);
    }
    async compareMacroVersions(id, oldVersion, newVersion) {
        const oldManifest = await this.registry.get(id, oldVersion);
        const newManifest = await this.registry.get(id, newVersion);
        if (!oldManifest || !newManifest) {
            throw new Error('One or both versions not found');
        }
        return this.registry.compareCapabilities(oldManifest, newManifest);
    }
    async getMacroVersions(id) {
        return await this.registry.getVersions(id);
    }
    async explainCapability(capability) {
        return this.riskExplainer.explainCapability(capability);
    }
    async expandCapabilities(capabilities) {
        return this.riskExplainer.expandCapabilities(capabilities);
    }
}
exports.RegistryAPI = RegistryAPI;
//# sourceMappingURL=registryAPI.js.map