import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

export type Capability = 
  | 'read:workspace'
  | 'write:workspace'
  | 'run:shell'
  | 'read:config'
  | 'write:config'
  | 'network:http'
  | 'secret:use'
  | 'secret:read'
  | string;

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

export function calculateChecksum(manifest: Omit<MacroManifest, 'checksum'>): string {
  const data = JSON.stringify({
    id: manifest.id,
    version: manifest.version,
    requires: manifest.requires.sort(),
    dependsOn: manifest.dependsOn
  });
  return createHash('sha256').update(data).digest('hex');
}

export function validateManifest(manifest: any): manifest is MacroManifest {
  if (!manifest.id || typeof manifest.id !== 'string') return false;
  if (!manifest.version || typeof manifest.version !== 'string') return false;
  if (!manifest.state || !['draft', 'approved', 'deprecated'].includes(manifest.state)) return false;
  if (!Array.isArray(manifest.requires)) return false;
  if (!manifest.checksum || typeof manifest.checksum !== 'string') return false;
  if (!manifest.author || typeof manifest.author !== 'string') return false;
  if (!manifest.createdAt || typeof manifest.createdAt !== 'number') return false;

  return true;
}
