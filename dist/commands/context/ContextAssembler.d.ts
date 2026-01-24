import { ContextStore } from './ContextStore';
import { RedactionFinding } from './ContextTypes';
export declare class ContextAssembler {
    private maxTokens;
    assemble(store: ContextStore, userInput: string): string;
    sanitizeContent(content: string): {
        sanitized: string;
        findings: RedactionFinding[];
    };
    optimizeForTokens(store: ContextStore, ratio: number): void;
    private computeImportance;
    private decay;
    private promoteToMemoryIfNeeded;
}
