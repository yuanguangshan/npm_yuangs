import { ToolExecutionResult } from '../state';
import { CapabilityLevel } from '../../core/capability/CapabilityLevel';

/**
 * Parameter definition for a tool.
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  description: string;
}

/**
 * Abstract tool interface — each tool implementation must satisfy this.
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  capabilityLevel?: CapabilityLevel;
  execute(params: Record<string, any>): Promise<ToolExecutionResult>;
}
