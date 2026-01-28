import { SemanticDiffResult } from './types';

export interface SemanticCommitExplanation {
    hash: string;
    author: string;
    date: string;
    originalMessage: string;
    semanticSummary: string;
    structuralChanges: SemanticDiffResult;
    impactLevel: 'low' | 'medium' | 'high' | 'breaking';
}

export interface HistoryExplanationResult {
    commits: SemanticCommitExplanation[];
    overallSummary: string;
}
