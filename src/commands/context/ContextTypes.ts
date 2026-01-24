export type ContextSource = 'file' | 'directory' | 'memory' | 'antipattern';

export type ContextStatus = 'active' | 'reference' | 'memory' | 'stale' | 'expired';

export interface ContextItem {
    id: string;
    source: ContextSource;
    path: string;
    alias?: string;

    content?: string;
    summary?: string;

    tokens: number;

    importance: number;
    lastUsedAt: number;
    addedAt: number;

    status: ContextStatus;

    pinned?: boolean;
    tags?: string[];
    decayRate?: number;

    hash?: string;
    ttlMs?: number;
    drifted?: boolean;
}

export interface DriftReport {
    id: string;
    path: string;
    reason: 'mtime_changed' | 'hash_changed';
}

export interface RedactionFinding {
    rule: string;
    count: number;
}
