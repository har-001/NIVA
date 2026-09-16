// ============================================
// NIVA — Sandboxed Plugin SDK Factory
// ============================================

import { NivaPluginSDK, PluginManifest, PluginPermission } from './types';
import { ToolDefinition } from '../tools/types';
import { logger } from '../../utils/logger';

export class PluginPermissionError extends Error {
  constructor(public pluginId: string, public permission: PluginPermission) {
    super(`[Security Sandbox] Plugin "${pluginId}" was denied action: missing permission "${permission}"`);
    this.name = 'PluginPermissionError';
  }
}

// In-memory plugin persistent key-value store
const pluginStorageStore = new Map<string, Map<string, any>>();

export function createPluginSDK(
  manifest: PluginManifest,
  config: Record<string, any>,
  onRegisterTool: (tool: ToolDefinition) => void
): NivaPluginSDK {
  const pluginId = manifest.id;

  if (!pluginStorageStore.has(pluginId)) {
    pluginStorageStore.set(pluginId, new Map<string, any>());
  }
  const storageMap = pluginStorageStore.get(pluginId)!;

  const hasPermission = (permission: PluginPermission): boolean => {
    return manifest.permissions.includes(permission);
  };

  const assertPermission = (permission: PluginPermission): void => {
    if (!hasPermission(permission)) {
      throw new PluginPermissionError(pluginId, permission);
    }
  };

  return {
    manifest,

    hasPermission,

    logger: {
      info: (msg: string) => logger.info(`[Plugin:${manifest.id}] ${msg}`),
      warn: (msg: string) => logger.warn(`[Plugin:${manifest.id}] ${msg}`),
      error: (msg: string) => logger.error(`[Plugin:${manifest.id}] ${msg}`),
      debug: (msg: string) => logger.debug(`[Plugin:${manifest.id}] ${msg}`),
    },

    storage: {
      get: async (key: string) => {
        assertPermission('storage:readwrite');
        return storageMap.get(key);
      },
      set: async (key: string, value: any) => {
        assertPermission('storage:readwrite');
        storageMap.set(key, value);
      },
      delete: async (key: string) => {
        assertPermission('storage:readwrite');
        return storageMap.delete(key);
      },
    },

    http: {
      fetch: async (url: string, options?: RequestInit) => {
        assertPermission('network:fetch');
        return fetch(url, options);
      },
    },

    registerTool: (tool: ToolDefinition) => {
      assertPermission('tools:register');
      onRegisterTool(tool);
    },
  };
}
