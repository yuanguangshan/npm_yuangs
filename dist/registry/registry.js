"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacroRegistry = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const manifest_1 = require("./manifest");
const errors_1 = require("./errors");
class MacroRegistry {
    config;
    manifests = new Map();
    constructor(config = {}) {
        this.config = {
            storagePath: config.storagePath || path_1.default.join(process.cwd(), '.yuangs_registry'),
            autoApproveSafe: config.autoApproveSafe ?? false,
            maxRiskLevel: config.maxRiskLevel || 'medium'
        };
    }
    async initialize() {
        try {
            await promises_1.default.mkdir(this.config.storagePath, { recursive: true });
            await this.loadFromDisk();
        }
        catch (error) {
            throw new errors_1.RegistryError(errors_1.RegistryErrorCode.INIT_FAILED, `Failed to initialize registry: ${error}`);
        }
    }
    async publish(manifest, options = {}) {
        const { autoApprove = this.config.autoApproveSafe, skipCapabilityCheck = false } = options;
        const newManifest = {
            ...manifest,
            createdAt: manifest.createdAt || Date.now(),
            state: manifest.state || 'draft',
            checksum: (0, manifest_1.calculateChecksum)(manifest)
        };
        if (!(0, manifest_1.validateManifest)(newManifest)) {
            throw new errors_1.RegistryError(errors_1.RegistryErrorCode.INVALID_MANIFEST, 'Invalid manifest structure');
        }
        const existingVersions = this.manifests.get(manifest.id) || [];
        const existing = existingVersions.find(v => v.version === manifest.version);
        if (existing) {
            if (existing.checksum !== newManifest.checksum) {
                throw new errors_1.RegistryError(errors_1.RegistryErrorCode.CHECKSUM_MISMATCH, `Version ${manifest.version} already exists with different checksum`);
            }
            return existing;
        }
        if (existingVersions.length > 0) {
            const diff = this.compareCapabilities(existingVersions[existingVersions.length - 1], newManifest);
            if (!skipCapabilityCheck && diff.requiresApproval) {
                newManifest.state = 'draft';
                newManifest.previousChecksum = existingVersions[existingVersions.length - 1].checksum;
            }
            else if (autoApprove) {
                newManifest.state = 'approved';
            }
        }
        else if (autoApprove) {
            newManifest.state = 'approved';
        }
        existingVersions.push(newManifest);
        this.manifests.set(manifest.id, existingVersions);
        await this.saveToDisk();
        return newManifest;
    }
    async get(macroId, version) {
        const versions = this.manifests.get(macroId);
        if (!versions || versions.length === 0) {
            return null;
        }
        if (version) {
            return versions.find(v => v.version === version) || null;
        }
        return versions[versions.length - 1];
    }
    async list(filters) {
        let results = [];
        for (const versions of this.manifests.values()) {
            const latest = versions[versions.length - 1];
            results.push(latest);
        }
        if (filters) {
            results = results.filter(m => {
                if (filters.state && m.state !== filters.state)
                    return false;
                if (filters.author && m.author !== filters.author)
                    return false;
                if (filters.tags && filters.tags.length > 0) {
                    const hasAllTags = filters.tags.every(tag => m.tags?.includes(tag));
                    if (!hasAllTags)
                        return false;
                }
                return true;
            });
        }
        return results.sort((a, b) => b.createdAt - a.createdAt);
    }
    async approve(macroId, version, approvedBy) {
        const versions = this.manifests.get(macroId);
        if (!versions) {
            throw new errors_1.RegistryError(errors_1.RegistryErrorCode.NOT_FOUND, `Macro ${macroId} not found`);
        }
        const manifest = versions.find(v => v.version === version);
        if (!manifest) {
            throw new errors_1.RegistryError(errors_1.RegistryErrorCode.NOT_FOUND, `Version ${version} of macro ${macroId} not found`);
        }
        if (manifest.state !== 'draft') {
            throw new errors_1.RegistryError(errors_1.RegistryErrorCode.INVALID_STATE, `Macro ${macroId}@${version} is not in draft state`);
        }
        manifest.state = 'approved';
        manifest.updatedAt = Date.now();
        await this.saveToDisk();
        return manifest;
    }
    async deprecate(macroId, version) {
        const versions = this.manifests.get(macroId);
        if (!versions) {
            throw new errors_1.RegistryError(errors_1.RegistryErrorCode.NOT_FOUND, `Macro ${macroId} not found`);
        }
        if (version) {
            const manifest = versions.find(v => v.version === version);
            if (!manifest) {
                throw new errors_1.RegistryError(errors_1.RegistryErrorCode.NOT_FOUND, `Version ${version} of macro ${macroId} not found`);
            }
            if (manifest.state !== 'approved') {
                throw new errors_1.RegistryError(errors_1.RegistryErrorCode.INVALID_STATE, `Cannot deprecate macro in ${manifest.state} state`);
            }
            manifest.state = 'deprecated';
            manifest.updatedAt = Date.now();
        }
        else {
            for (const manifest of versions) {
                if (manifest.state === 'approved') {
                    manifest.state = 'deprecated';
                    manifest.updatedAt = Date.now();
                }
            }
        }
        await this.saveToDisk();
        return version ? versions.find(v => v.version === version) : versions[versions.length - 1];
    }
    compareCapabilities(oldManifest, newManifest) {
        const oldSet = new Set(oldManifest.requires);
        const newSet = new Set(newManifest.requires);
        const added = [];
        const removed = [];
        const unchanged = [];
        for (const cap of newManifest.requires) {
            if (!oldSet.has(cap)) {
                added.push(cap);
            }
            else {
                unchanged.push(cap);
            }
        }
        for (const cap of oldManifest.requires) {
            if (!newSet.has(cap)) {
                removed.push(cap);
            }
        }
        const highRiskAdded = added.some(cap => cap.includes('shell') || cap.includes('write') || cap.includes('delete'));
        const hasNewCapabilities = added.length > 0;
        const requiresApproval = highRiskAdded || (hasNewCapabilities && !this.config.autoApproveSafe);
        return {
            hasChanges: added.length > 0 || removed.length > 0,
            capabilityDiff: {
                added,
                removed,
                unchanged
            },
            requiresApproval,
            reason: requiresApproval ? 'New capabilities require approval' : undefined
        };
    }
    async getVersions(macroId) {
        return this.manifests.get(macroId) || [];
    }
    async loadFromDisk() {
        try {
            const indexPath = path_1.default.join(this.config.storagePath, 'index.json');
            const data = await promises_1.default.readFile(indexPath, 'utf-8');
            const loaded = JSON.parse(data);
            for (const [id, versions] of Object.entries(loaded)) {
                this.manifests.set(id, versions);
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`Warning: Failed to load registry from disk: ${error}`);
            }
        }
    }
    async saveToDisk() {
        const indexPath = path_1.default.join(this.config.storagePath, 'index.json');
        const data = Object.fromEntries(this.manifests);
        await promises_1.default.writeFile(indexPath, JSON.stringify(data, null, 2), 'utf-8');
    }
}
exports.MacroRegistry = MacroRegistry;
//# sourceMappingURL=registry.js.map