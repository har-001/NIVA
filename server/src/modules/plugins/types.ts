// ============================================
// NIVA — Plugin Ecosystem & SDK Types
// ============================================

import { ToolDefinition } from '../tools/types';

export type PluginPermission =
  | 'tools:register'
  | 'tools:execute'
  | 'network:fetch'
  | 'system:control'
  | 'storage:readwrite';

export type PluginCategory =
  | 'productivity'
  | 'developer'
  | 'entertainment'
  | 'utilities'
  | 'finance';

export interface PluginSettingField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'secret';
  description?: string;
  defaultValue?: any;
  required?: boolean;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  icon?: string;
  category: PluginCategory;
  permissions: PluginPermission[];
  settingsSchema?: PluginSettingField[];
  tools?: ToolDefinition[];
}

export type PluginStatus = 'active' | 'disabled' | 'error';

export interface PluginInstance {
  manifest: PluginManifest;
  status: PluginStatus;
  config: Record<string, any>;
  installedAt: string;
  updatedAt: string;
  error?: string;
}

export interface PluginExecutionContext {
  pluginId: string;
  config: Record<string, any>;
  userId?: string;
}

export interface NivaPluginSDK {
  manifest: PluginManifest;
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    debug: (msg: string) => void;
  };
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<boolean>;
  };
  http: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
  registerTool: (tool: ToolDefinition) => void;
  hasPermission: (permission: PluginPermission) => boolean;
}
