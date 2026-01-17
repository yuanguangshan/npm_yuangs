import { AgentAction } from './types';
export declare function executeAction(action: AgentAction, options?: {
    autoYes?: boolean;
}): Promise<void>;
