import { MacroRegistry } from '../registry/registry';
import { RiskExplainer, createCapabilityGraph } from '../risk/explainer';
import type { MacroManifest, MacroPublishOptions, Capability } from '../registry/manifest';
import type { RiskAssessment } from '../risk/explainer';

export class RegistryAPI {
  private registry: MacroRegistry;
  private riskExplainer: RiskExplainer;

  constructor(storagePath?: string) {
    this.registry = new MacroRegistry({ storagePath });
    this.riskExplainer = new RiskExplainer(createCapabilityGraph());
  }

  async initialize(): Promise<void> {
    await this.registry.initialize();
  }

  async publishMacro(
    id: string,
    version: string,
    description: string,
    requires: Capability[],
    author: string,
    options: MacroPublishOptions = {}
  ): Promise<MacroManifest> {
    const manifest: Omit<MacroManifest, 'checksum'> = {
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

  async getMacro(id: string, version?: string): Promise<MacroManifest | null> {
    return await this.registry.get(id, version);
  }

  async listMacros(filters?: {
    state?: 'draft' | 'approved' | 'deprecated';
    author?: string;
    tags?: string[];
  }): Promise<MacroManifest[]> {
    return await this.registry.list(filters);
  }

  async approveMacro(id: string, version: string, approvedBy: string): Promise<MacroManifest> {
    return await this.registry.approve(id, version, approvedBy);
  }

  async deprecateMacro(id: string, version?: string): Promise<MacroManifest> {
    return await this.registry.deprecate(id, version);
  }

  async assessMacroRisk(id: string, version?: string): Promise<RiskAssessment | null> {
    const manifest = await this.registry.get(id, version);
    if (!manifest) {
      return null;
    }

    return this.riskExplainer.explainRisk(manifest);
  }

  async compareMacroVersions(id: string, oldVersion: string, newVersion: string) {
    const oldManifest = await this.registry.get(id, oldVersion);
    const newManifest = await this.registry.get(id, newVersion);

    if (!oldManifest || !newManifest) {
      throw new Error('One or both versions not found');
    }

    return this.registry.compareCapabilities(oldManifest, newManifest);
  }

  async getMacroVersions(id: string) {
    return await this.registry.getVersions(id);
  }

  async explainCapability(capability: Capability): Promise<string> {
    return this.riskExplainer.explainCapability(capability);
  }

  async expandCapabilities(capabilities: Capability[]): Promise<Capability[]> {
    return this.riskExplainer.expandCapabilities(capabilities);
  }
}
