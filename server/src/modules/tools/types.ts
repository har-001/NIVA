// ============================================
// NIVA — Tool Registry Types
// ============================================

export interface ToolParameterSchema {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
  permission: 'safe' | 'confirm' | 'system';
  execute: (args: Record<string, any>, context?: any) => Promise<string>;
}

export interface ToolCallExecution {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: string;
  isError?: boolean;
}
