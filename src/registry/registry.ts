import fs from 'fs/promises';
import path from 'path';
import type {
  MacroManifest,
  MacroState,
  MacroPublishOptions,
  MacroDiffResult,
  MacroRegistryConfig,
  Capability
} from './manifest';
import { calculateChecksum, validateManifest } from './manifest';
import { RegistryError, RegistryErrorCode } from './errors';

export class MacroRegistry {
  private config: MacroRegistryConfig;
  private manifests: Map<string, MacroManifest[]> = new Map();

  constructor(config: Partial<MacroRegistryConfig> = {}) {
    this.config = {
      storagePath: config.storagePath || path.join(process.cwd(), '.yuangs_registry'),
      autoApproveSafe: config.autoApproveSafe ?? false,
      maxRiskLevel: config.maxRiskLevel || 'medium'
    };
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.config.storagePath, { recursive: true });
      await this.loadFromDisk();
    } catch (error) {
      throw new RegistryError(
        RegistryErrorCode.INIT_FAILED,
        `Failed to initialize registry: ${error}`
      );
    }
  }

  async publish(
    manifest: Omit<MacroManifest, 'checksum'>,
    options: MacroPublishOptions = {}
  ): Promise<MacroManifest> {
    const { autoApprove = this.config.autoApproveSafe, skipCapabilityCheck = false } = options;

    const newManifest: MacroManifest = {
      ...manifest,
      createdAt: manifest.createdAt || Date.now(),
      state: manifest.state || 'draft',
      checksum: calculateChecksum(manifest)
    };

    if (!validateManifest(newManifest)) {
      throw new RegistryError(
        RegistryErrorCode.INVALID_MANIFEST,
        'Invalid manifest structure'
      );
    }

    const existingVersions = this.manifests.get(manifest.id) || [];
    const existing = existingVersions.find(v => v.version === manifest.version);

    if (existing) {
      if (existing.checksum !== newManifest.checksum) {
        throw new RegistryError(
          RegistryErrorCode.CHECKSUM_MISMATCH,
          `Version ${manifest.version} already exists with different checksum`
        );
      }
      return existing;
    }

    if (existingVersions.length > 0) {
      const diff = this.compareCapabilities(existingVersions[existingVersions.length - 1], newManifest);

      if (!skipCapabilityCheck && diff.requiresApproval) {
        newManifest.state = 'draft';
        newManifest.previousChecksum = existingVersions[existingVersions.length - 1].checksum;
      } else if (autoApprove) {
        newManifest.state = 'approved';
      }
    } else if (autoApprove) {
      newManifest.state = 'approved';
    }

    existingVersions.push(newManifest);
    this.manifests.set(manifest.id, existingVersions);

    await this.saveToDisk();

    return newManifest;
  }

  async get(macroId: string, version?: string): Promise<MacroManifest | null> {
    const versions = this.manifests.get(macroId);
    if (!versions || versions.length === 0) {
      return null;
    }

    if (version) {
      return versions.find(v => v.version === version) || null;
    }

    return versions[versions.length - 1];
  }

  async list(filters?: {
    state?: MacroState;
    author?: string;
    tags?: string[];
  }): Promise<MacroManifest[]> {
    let results: MacroManifest[] = [];

    for (const versions of this.manifests.values()) {
      const latest = versions[versions.length - 1];
      results.push(latest);
    }

    if (filters) {
      results = results.filter(m => {
        if (filters.state && m.state !== filters.state) return false;
        if (filters.author && m.author !== filters.author) return false;
        if (filters.tags && filters.tags.length > 0) {
          const hasAllTags = filters.tags.every(tag => m.tags?.includes(tag));
          if (!hasAllTags) return false;
        }
        return true;
      });
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  async approve(macroId: string, version: string, approvedBy: string): Promise<MacroManifest> {
    const versions = this.manifests.get(macroId);
    if (!versions) {
      throw new RegistryError(
        RegistryErrorCode.NOT_FOUND,
        `Macro ${macroId} not found`
      );
    }

    const manifest = versions.find(v => v.version === version);
    if (!manifest) {
      throw new RegistryError(
        RegistryErrorCode.NOT_FOUND,
        `Version ${version} of macro ${macroId} not found`
      );
    }

    if (manifest.state !== 'draft') {
      throw new RegistryError(
        RegistryErrorCode.INVALID_STATE,
        `Macro ${macroId}@${version} is not in draft state`
      );
    }

    manifest.state = 'approved';
    manifest.updatedAt = Date.now();

    await this.saveToDisk();

    return manifest;
  }

  async deprecate(macroId: string, version?: string): Promise<MacroManifest> {
    const versions = this.manifests.get(macroId);
    if (!versions) {
      throw new RegistryError(
        RegistryErrorCode.NOT_FOUND,
        `Macro ${macroId} not found`
      );
    }

    if (version) {
      const manifest = versions.find(v => v.version === version);
      if (!manifest) {
        throw new RegistryError(
          RegistryErrorCode.NOT_FOUND,
          `Version ${version} of macro ${macroId} not found`
        );
      }

      if (manifest.state !== 'approved') {
        throw new RegistryError(
          RegistryErrorCode.INVALID_STATE,
          `Cannot deprecate macro in ${manifest.state} state`
        );
      }

      manifest.state = 'deprecated';
      manifest.updatedAt = Date.now();
    } else {
      for (const manifest of versions) {
        if (manifest.state === 'approved') {
          manifest.state = 'deprecated';
          manifest.updatedAt = Date.now();
        }
      }
    }

    await this.saveToDisk();

    return version ? versions.find(v => v.version === version)! : versions[versions.length - 1];
  }

  compareCapabilities(
    oldManifest: MacroManifest,
    newManifest: MacroManifest
  ): MacroDiffResult {
    const oldSet = new Set(oldManifest.requires);
    const newSet = new Set(newManifest.requires);

    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];

    for (const cap of newManifest.requires) {
      if (!oldSet.has(cap)) {
        added.push(cap);
      } else {
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

  async getVersions(macroId: string): Promise<MacroManifest[]> {
    return this.manifests.get(macroId) || [];
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const indexPath = path.join(this.config.storagePath, 'index.json');
      const data = await fs.readFile(indexPath, 'utf-8');
      const loaded = JSON.parse(data) as Record<string, MacroManifest[]>;

      for (const [id, versions] of Object.entries(loaded)) {
        this.manifests.set(id, versions);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Warning: Failed to load registry from disk: ${error}`);
      }
    }
  }

  private async saveToDisk(): Promise<void> {
    const indexPath = path.join(this.config.storagePath, 'index.json');
    const data = Object.fromEntries(this.manifests);
    await fs.writeFile(indexPath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
