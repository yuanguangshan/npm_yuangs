export enum ChangeType {
    ADDITION = 'addition',
    DELETION = 'deletion',
}

export enum SemanticCategory {
    FUNCTION = 'function',
    CLASS = 'class',
    INTERFACE = 'interface',
    TYPE = 'type',
    CONSTANT = 'constant',
    UNKNOWN = 'unknown',
}

export interface SemanticChange {
    type: ChangeType;
    category: SemanticCategory;
    name: string;
    details?: string;
    isBreaking: boolean;
}

export interface FileSemanticDiff {
    path: string;
    changes: SemanticChange[];
    summary: string;
}

export interface SemanticDiffResult {
    files: FileSemanticDiff[];
    overallSummary: string;
    isBreaking: boolean;
}
