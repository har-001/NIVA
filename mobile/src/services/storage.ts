// ============================================
// NIVA — Mobile Universal Storage Adapter
// Works across React Native, Web, and Test environments
// ============================================

class MobileStorage {
  private memoryCache: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    try {
      // In native environment, use AsyncStorage if present
      if (typeof window !== 'undefined' && (window as any).AsyncStorage) {
        return await (window as any).AsyncStorage.getItem(key);
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return this.memoryCache.get(key) || null;
    } catch {
      return this.memoryCache.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.memoryCache.set(key, value);
      if (typeof window !== 'undefined' && (window as any).AsyncStorage) {
        await (window as any).AsyncStorage.setItem(key, value);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      this.memoryCache.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      if (typeof window !== 'undefined' && (window as any).AsyncStorage) {
        await (window as any).AsyncStorage.removeItem(key);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      this.memoryCache.delete(key);
    }
  }

  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {}
  }
}

export const mobileStorage = new MobileStorage();
