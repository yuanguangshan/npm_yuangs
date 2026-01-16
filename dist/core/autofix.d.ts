import { OSProfile } from './os';
import { AIFixPlan } from './validation';
export declare function autoFixCommand(originalCmd: string, stderr: string, os: OSProfile, model?: string): Promise<AIFixPlan | null>;
