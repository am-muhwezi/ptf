/**
 * Simple in-memory cache utility for React components
 * Provides TTL (Time To Live) based caching with automatic cleanup
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    return cached.value;
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete a specific key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);

    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear cache
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get all keys in cache
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.cache.keys());
  }
}

// Create global cache instances for different data types
export const memberCache = new SimpleCache();
export const statsCache = new SimpleCache();

// Cache keys
export const CACHE_KEYS = {
  OUTDOOR_STATS: 'outdoor_stats',
  INDOOR_STATS: 'indoor_stats',
  ALL_MEMBERS_STATS: 'all_members_stats',
  OUTDOOR_MEMBERS: (page, search, status) => `outdoor_members_${page}_${search || 'all'}_${status || 'all'}`,
  INDOOR_MEMBERS: (page, search, status) => `indoor_members_${page}_${search || 'all'}_${status || 'all'}`,
  ALL_MEMBERS: (page, search, status, membershipType) => `all_members_${page}_${search || 'all'}_${status || 'all'}_${membershipType || 'all'}`
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  STATS: 5 * 60 * 1000,     // 5 minutes for stats
  MEMBERS: 2 * 60 * 1000,   // 2 minutes for member data
  SEARCH: 1 * 60 * 1000     // 1 minute for search results
};

export default SimpleCache;