import { Tool, ToolParameter } from './types';
import { CapabilityLevel } from '../../core/capability/CapabilityLevel';

/**
 * Tool registry — manages tool registration and lookup.
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool instance.
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools at once.
   */
  registerAll(tools: Tool[]): void {
    for (const t of tools) {
      this.register(t);
    }
  }

  /**
   * Get a tool by name.
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tool names.
   */
  names(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all registered tool instances.
   */
  all(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Generate tool definitions for LLM prompt (JSON schema format).
   */
  generateDefinitions(): Array<{ name: string; description: string; parameters: Record<string, any> }> {
    return this.all().map(t => ({
      name: t.name,
      description: t.description,
      parameters: this.parametersToSchema(t.parameters)
    }));
  }

  private parametersToSchema(params: ToolParameter[]): Record<string, any> {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const p of params) {
      properties[p.name] = {
        type: p.type === 'array' ? 'array' : p.type,
        description: p.description
      };
      if (p.required) {
        required.push(p.name);
      }
    }

    return {
      type: 'object',
      properties,
      required
    };
  }
}
