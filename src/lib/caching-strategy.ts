import { supabase } from '@/integrations/supabase/client';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
  strategy: 'lru' | 'lfu' | 'fifo'; // Eviction strategy
  namespace: string;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number; // Estimated size in bytes
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
}

export class IntelligentCacheManager {
  private static instance: IntelligentCacheManager;
  private caches: Map<string, Map<string, CacheEntry>> = new Map();
  private configs: Map<string, CacheConfig> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): IntelligentCacheManager {
    if (!IntelligentCacheManager.instance) {
      IntelligentCacheManager.instance = new IntelligentCacheManager();
    }
    return IntelligentCacheManager.instance;
  }

  /**
   * Initialize cache manager with default configurations
   */
  initialize(): void {
    // Default cache configurations
    this.registerCache('listings', {
      ttl: 300, // 5 minutes
      maxSize: 50 * 1024 * 1024, // 50MB
      strategy: 'lru',
      namespace: 'listings'
    });

    this.registerCache('profiles', {
      ttl: 600, // 10 minutes
      maxSize: 10 * 1024 * 1024, // 10MB
      strategy: 'lru',
      namespace: 'profiles'
    });

    this.registerCache('categories', {
      ttl: 3600, // 1 hour
      maxSize: 5 * 1024 * 1024, // 5MB
      strategy: 'lfu',
      namespace: 'categories'
    });

    this.registerCache('search', {
      ttl: 180, // 3 minutes
      maxSize: 20 * 1024 * 1024, // 20MB
      strategy: 'lru',
      namespace: 'search'
    });

    this.registerCache('analytics', {
      ttl: 900, // 15 minutes
      maxSize: 15 * 1024 * 1024, // 15MB
      strategy: 'lfu',
      namespace: 'analytics'
    });

    // Start cleanup process
    this.startCleanupProcess();

    console.log('Intelligent cache manager initialized');
  }

  /**
   * Register a new cache with configuration
   */
  registerCache(namespace: string, config: CacheConfig): void {
    this.configs.set(namespace, config);
    this.caches.set(namespace, new Map());
    this.stats.set(namespace, {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSize: 0,
      entryCount: 0,
      evictions: 0
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const cache = this.caches.get(namespace);
    const stats = this.stats.get(namespace);
    
    if (!cache || !stats) {
      console.warn(`Cache namespace '${namespace}' not found`);
      return null;
    }

    const entry = cache.get(key);
    
    if (!entry) {
      stats.misses++;
      this.updateHitRate(namespace);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      cache.delete(key);
      stats.misses++;
      stats.entryCount--;
      stats.totalSize -= entry.size;
      this.updateHitRate(namespace);
      return null;
    }

    // Update hit count and stats
    entry.hits++;
    stats.hits++;
    this.updateHitRate(namespace);

    // Track cache performance
    this.trackCacheAccess(namespace, key, 'hit');

    return entry.value;
  }

  /**
   * Set value in cache
   */
  async set<T>(namespace: string, key: string, value: T, customTtl?: number): Promise<void> {
    const cache = this.caches.get(namespace);
    const config = this.configs.get(namespace);
    const stats = this.stats.get(namespace);
    
    if (!cache || !config || !stats) {
      console.warn(`Cache namespace '${namespace}' not found`);
      return;
    }

    const size = this.estimateSize(value);
    const ttl = customTtl || config.ttl;
    
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size
    };

    // Check if we need to evict entries
    if (stats.totalSize + size > config.maxSize) {
      await this.evictEntries(namespace, size);
    }

    // Remove existing entry if it exists
    const existingEntry = cache.get(key);
    if (existingEntry) {
      stats.totalSize -= existingEntry.size;
      stats.entryCount--;
    }

    // Add new entry
    cache.set(key, entry);
    stats.totalSize += size;
    stats.entryCount++;

    // Track cache write
    this.trackCacheAccess(namespace, key, 'write');
  }

  /**
   * Delete value from cache
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    const cache = this.caches.get(namespace);
    const stats = this.stats.get(namespace);
    
    if (!cache || !stats) {
      return false;
    }

    const entry = cache.get(key);
    if (entry) {
      cache.delete(key);
      stats.totalSize -= entry.size;
      stats.entryCount--;
      return true;
    }

    return false;
  }

  /**
   * Clear entire cache namespace
   */
  async clear(namespace: string): Promise<void> {
    const cache = this.caches.get(namespace);
    const stats = this.stats.get(namespace);
    
    if (!cache || !stats) {
      return;
    }

    cache.clear();
    stats.totalSize = 0;
    stats.entryCount = 0;
    stats.evictions = 0;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(namespace: string, pattern: string): Promise<number> {
    const cache = this.caches.get(namespace);
    const stats = this.stats.get(namespace);
    
    if (!cache || !stats) {
      return 0;
    }

    const regex = new RegExp(pattern);
    let invalidated = 0;

    for (const [key, entry] of cache.entries()) {
      if (regex.test(key)) {
        cache.delete(key);
        stats.totalSize -= entry.size;
        stats.entryCount--;
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Get cache statistics
   */
  getStats(namespace?: string): CacheStats | Map<string, CacheStats> {
    if (namespace) {
      return this.stats.get(namespace) || {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0,
        evictions: 0
      };
    }

    return new Map(this.stats);
  }

  /**
   * Evict entries based on strategy
   */
  private async evictEntries(namespace: string, requiredSpace: number): Promise<void> {
    const cache = this.caches.get(namespace);
    const config = this.configs.get(namespace);
    const stats = this.stats.get(namespace);
    
    if (!cache || !config || !stats) {
      return;
    }

    const entries = Array.from(cache.entries()).map(([key, entry]) => ({ key, ...entry }));
    let freedSpace = 0;

    // Sort entries based on eviction strategy
    switch (config.strategy) {
      case 'lru': // Least Recently Used
        entries.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'lfu': // Least Frequently Used
        entries.sort((a, b) => a.hits - b.hits);
        break;
      case 'fifo': // First In, First Out
        entries.sort((a, b) => a.timestamp - b.timestamp);
        break;
    }

    // Evict entries until we have enough space
    for (const entry of entries) {
      if (freedSpace >= requiredSpace) {
        break;
      }

      cache.delete(entry.key);
      stats.totalSize -= entry.size;
      stats.entryCount--;
      stats.evictions++;
      freedSpace += entry.size;
    }
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    const jsonString = JSON.stringify(value);
    return new Blob([jsonString]).size;
  }

  /**
   * Update hit rate for namespace
   */
  private updateHitRate(namespace: string): void {
    const stats = this.stats.get(namespace);
    if (stats) {
      const total = stats.hits + stats.misses;
      stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
    }
  }

  /**
   * Track cache access for analytics
   */
  private async trackCacheAccess(namespace: string, key: string, type: 'hit' | 'miss' | 'write'): Promise<void> {
    try {
      // Store cache analytics in database for performance monitoring
      await supabase.from('cache_analytics').insert({
        namespace,
        cache_key: key,
        access_type: type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Don't let cache analytics failures affect cache operations
      console.warn('Failed to track cache access:', error);
    }
  }

  /**
   * Start cleanup process for expired entries
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Run every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [namespace, cache] of this.caches.entries()) {
      const stats = this.stats.get(namespace);
      if (!stats) continue;

      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > entry.ttl * 1000) {
          cache.delete(key);
          stats.totalSize -= entry.size;
          stats.entryCount--;
        }
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.caches.clear();
    this.configs.clear();
    this.stats.clear();
  }
}

// Cache-aware data fetching utilities
export class CachedDataService {
  private cache = IntelligentCacheManager.getInstance();

  /**
   * Get listings with caching
   */
  async getListings(filters: any = {}): Promise<any[]> {
    const cacheKey = `listings:${JSON.stringify(filters)}`;
    
    // Try cache first
    let listings = await this.cache.get<any[]>('listings', cacheKey);
    
    if (!listings) {
      // Fetch from database
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .match(filters)
        .eq('status', 'active');

      if (error) throw error;
      
      listings = data || [];
      
      // Cache the results
      await this.cache.set('listings', cacheKey, listings);
    }

    return listings;
  }

  /**
   * Get user profile with caching
   */
  async getUserProfile(userId: string): Promise<any | null> {
    const cacheKey = `profile:${userId}`;
    
    let profile = await this.cache.get<any>('profiles', cacheKey);
    
    if (!profile) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      profile = data;
      
      if (profile) {
        await this.cache.set('profiles', cacheKey, profile);
      }
    }

    return profile;
  }

  /**
   * Get categories with caching
   */
  async getCategories(): Promise<any[]> {
    const cacheKey = 'all_categories';
    
    let categories = await this.cache.get<any[]>('categories', cacheKey);
    
    if (!categories) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      
      categories = data || [];
      
      // Cache categories for longer since they change infrequently
      await this.cache.set('categories', cacheKey, categories, 3600); // 1 hour
    }

    return categories;
  }

  /**
   * Search with caching
   */
  async searchListings(query: string, filters: any = {}): Promise<any[]> {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
    
    let results = await this.cache.get<any[]>('search', cacheKey);
    
    if (!results) {
      // Perform search query
      let queryBuilder = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active');

      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });

      const { data, error } = await queryBuilder;

      if (error) throw error;
      
      results = data || [];
      
      // Cache search results for shorter time
      await this.cache.set('search', cacheKey, results, 180); // 3 minutes
    }

    return results;
  }

  /**
   * Invalidate cache when data changes
   */
  async invalidateListingCache(listingId?: string): Promise<void> {
    if (listingId) {
      // Invalidate specific listing patterns
      await this.cache.invalidatePattern('listings', `.*${listingId}.*`);
      await this.cache.invalidatePattern('search', '.*');
    } else {
      // Invalidate all listing caches
      await this.cache.clear('listings');
      await this.cache.clear('search');
    }
  }

  /**
   * Invalidate profile cache
   */
  async invalidateProfileCache(userId: string): Promise<void> {
    await this.cache.delete('profiles', `profile:${userId}`);
  }

  /**
   * Invalidate category cache
   */
  async invalidateCategoryCache(): Promise<void> {
    await this.cache.clear('categories');
  }
}

// Export singleton instances
export const cacheManager = IntelligentCacheManager.getInstance();
export const cachedDataService = new CachedDataService();
