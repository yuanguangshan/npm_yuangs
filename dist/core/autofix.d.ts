import { OSProfile } from './os';
import { AICommandPlan } from './validation';
export declare function autoFixCommand(originalCmd: string, stderr: string, os: OSProfile, model?: string): Promise<AICommandPlan | null>;
