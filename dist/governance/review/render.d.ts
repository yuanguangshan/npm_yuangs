import { DiffFile } from "./diffParser";
export declare function renderSummary(files: DiffFile[]): void;
export declare function renderDiffForReview(files: DiffFile[], rationale: string): void;
export declare function renderRiskAssessment(level: "low" | "medium" | "high", warnings: string[]): void;
export declare function promptForApproval(): Promise<boolean>;
