// ============================================
// NIVA — AI Provider Registry
// ============================================

import { AIProvider } from './types';
import { GeminiProvider } from './providers/gemini.provider';
import { FallbackProvider } from './providers/fallback.provider';
import { logger } from '../../utils/logger';

/**
 * Registry that manages all AI providers and selects the active one.
 * Supports fallback: if the primary provider fails, tries the next available.
 */
class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProvider: string = 'gemini';

  constructor() {
    // Register built-in providers
    this.register(new GeminiProvider());
    this.register(new FallbackProvider());
  }

  /**
   * Register a new AI provider
   */
  register(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
    logger.info(`AI Provider registered: ${provider.name} (available: ${provider.isAvailable()})`);
  }

  /**
   * Set the primary provider name
   */
  setPrimary(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider "${name}" not registered`);
    }
    this.primaryProvider = name;
    logger.info(`Primary AI provider set to: ${name}`);
  }

  /**
   * Get the active provider (primary if available, otherwise first available fallback)
   */
  getProvider(name?: string): AIProvider {
    const targetName = name || this.primaryProvider;
    const provider = this.providers.get(targetName);

    if (provider?.isAvailable()) {
      return provider;
    }

    // Fallback: find first available provider
    for (const [provName, prov] of this.providers) {
      if (prov.isAvailable()) {
        logger.warn(`Primary provider "${targetName}" unavailable, falling back to "${provName}"`);
        return prov;
      }
    }

    throw new Error(
      'No AI provider available. Please configure at least one provider (e.g., set GEMINI_API_KEY).'
    );
  }

  /**
   * List all registered providers and their availability
   */
  listProviders(): { name: string; available: boolean; primary: boolean }[] {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      available: provider.isAvailable(),
      primary: name === this.primaryProvider,
    }));
  }
}

export const aiRegistry = new AIProviderRegistry();
