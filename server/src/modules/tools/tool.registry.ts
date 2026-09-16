// ============================================
// NIVA — Tool Registry Manager
// ============================================

import { ToolDefinition, ToolCallExecution } from './types';
import { systemTools } from './system.tools';
import { logger } from '../../utils/logger';
import { AIToolDefinition } from '../ai/types';

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    // Register all default system tools
    for (const tool of systemTools) {
      this.register(tool);
    }
  }

  /**
   * Register a new tool
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    logger.debug(`Tool registered: ${tool.name} [${tool.permission}]`);
  }

  /**
   * Unregister a tool by name
   */
  unregister(name: string): boolean {
    const deleted = this.tools.delete(name);
    if (deleted) {
      logger.debug(`Tool unregistered: ${name}`);
    }
    return deleted;
  }

  /**
   * Get a specific tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools
   */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Export tools in unified AIToolDefinition format for AI Providers (Gemini / OpenAI)
   */
  toAIToolDefinitions(): AIToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Execute a tool call safely
   */
  async execute(name: string, args: Record<string, any>, context?: any): Promise<ToolCallExecution> {
    const tool = this.tools.get(name);
    if (!tool) {
      logger.warn(`Tool not found: ${name}`);
      return {
        id: `call_${Date.now()}`,
        name,
        arguments: args,
        result: `Tool "${name}" is not registered.`,
        isError: true,
      };
    }

    try {
      logger.info(`Executing tool: ${name} with args: ${JSON.stringify(args)}`);
      const result = await tool.execute(args, context);
      return {
        id: `call_${Date.now()}`,
        name,
        arguments: args,
        result,
        isError: false,
      };
    } catch (err: any) {
      logger.error(`Error executing tool ${name}:`, err);
      return {
        id: `call_${Date.now()}`,
        name,
        arguments: args,
        result: `Execution error: ${err.message}`,
        isError: true,
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
