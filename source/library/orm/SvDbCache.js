/**
 * @module webserver/orm
 */

"use strict";

const { Base } = require("../../../GameServer/site/strvct/webserver");
const FifoMap = require("/Users/steve/_projects/Active/undreamedof.ai/Servers/GameServer/site/strvct/source/library/ideal/categories/FifoMap.js");

/**
 * @class SvDbCache
 * @extends Base
 * @classdesc A two-tier caching system for database rows combining FIFO and weak reference caching.
 * 
 * This cache provides optimal performance by using a FIFO (First In, First Out) cache for recently
 * accessed rows and a weak reference cache for longer-term storage. The FIFO cache ensures fast
 * access to frequently used rows while the weak cache prevents memory leaks by allowing garbage
 * collection when rows are no longer referenced elsewhere.
 * 
 * Key features:
 * - Fast access to recently used rows via FIFO cache
 * - Memory-efficient storage via weak reference cache  
 * - Automatic cleanup when FIFO limit is exceeded
 * - Garbage collection friendly for unused rows
 * 
 * Cache strategy:
 * 1. get() checks FIFO cache first (fastest), then weak cache
 * 2. set() adds to both FIFO and weak caches, evicts oldest from FIFO if needed
 * 3. delete() removes from both caches
 * 
 * Usage:
 * ```javascript
 * const cache = SvDbCache.clone();
 * cache.setFifoLimit(100); // Keep 100 most recent rows in fast cache
 * 
 * cache.set("user-123", userRow);
 * const user = cache.get("user-123"); // Fast FIFO lookup
 * cache.delete("user-123");
 * ```
 */
const SvDbCache = (class SvDbCache extends SvBase {

    /**
     * @description Initialize prototype slots for the SvDbCache.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            this.newSlot("fifoMap", null);
            this.newSlot("weakRowMap", null);
            this.newSlot("fifoLimit", 100);
        }
    }

    /**
     * @description Initialize prototype for the SvDbCache.
     * @category Initialization
     */
    initPrototype () {
        // Prototype initialization will be implemented here
    }

    /**
     * @description Initialize the cache instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setFifoMap(FifoMap.clone());
        this.setWeakRowMap(new WeakMap());
        return this;
    }

    /**
     * Get a row from the cache
     * @param {string} key - The cache key (typically row ID)
     * @returns {Object|undefined} The cached row object or undefined if not found
     * @description Checks FIFO cache first for fastest access, then falls back to weak cache
     */
    get (key) {
        // First check the FIFO cache for recently accessed items (fastest)
        if (this.fifoMap().has(key)) {
            return this.fifoMap().get(key);
        }
        
        // Fall back to weak cache for longer-term storage
        return this.weakRowMap().get(key);
    }

    /**
     * Store a row in the cache
     * @param {string} key - The cache key (typically row ID)
     * @param {Object} value - The row object to cache
     * @description Adds to both FIFO and weak caches, evicts oldest from FIFO if needed
     */
    set (key, value) {
        // Add to weak cache for long-term storage (garbage collection friendly)
        this.weakRowMap().set(key, value);
        
        // Add to FIFO cache for fast recent access
        this.fifoMap().set(key, value);
        
        // Enforce FIFO limit by removing oldest entries
        while (this.fifoMap().size() > this.fifoLimit()) {
            // Remove the oldest entry from FIFO cache
            // Note: We don't remove from weak cache as it may still be referenced elsewhere
            const oldestKey = this.fifoMap().oldestKey();
            if (oldestKey !== undefined) {
                this.fifoMap().delete(oldestKey);
            } else {
                break; // Safety check
            }
        }
    }

    /**
     * Remove a row from the cache
     * @param {string} key - The cache key to remove
     * @returns {boolean} True if the key existed and was deleted, false otherwise
     * @description Removes from both FIFO and weak caches
     */
    delete (key) {
        const fifoDeleted = this.fifoMap().delete(key);
        const weakDeleted = this.weakRowMap().delete(key);
        
        // Return true if deleted from either cache
        return fifoDeleted || weakDeleted;
    }

    /**
     * Check if a key exists in the cache
     * @param {string} key - The cache key to check
     * @returns {boolean} True if the key exists in either cache
     */
    has (key) {
        return this.fifoMap().has(key) || this.weakRowMap().has(key);
    }

    /**
     * Clear all cached entries
     * @description Removes all entries from both FIFO and weak caches
     */
    clear () {
        this.fifoMap().clear();
        // Note: WeakMap doesn't have a clear() method, so we create a new instance
        this.setWeakRowMap(new WeakMap());
    }

    /**
     * Get the current size of the FIFO cache
     * @returns {number} Number of entries in the FIFO cache
     * @description Note: WeakMap size is not accessible, only FIFO size is returned
     */
    size () {
        return this.fifoMap().size();
    }

    /**
     * Get cache statistics for monitoring and debugging
     * @returns {Object} Object containing cache statistics
     */
    stats () {
        return {
            fifoSize: this.fifoMap().size(),
            fifoLimit: this.fifoLimit(),
            fifoUtilization: (this.fifoMap().size() / this.fifoLimit() * 100).toFixed(1) + '%'
        };
    }

    /**
     * Get all keys currently in the FIFO cache
     * @returns {Array<string>} Array of keys in FIFO cache (most recent first)
     * @description Useful for debugging and monitoring cache contents
     */
    fifoKeys () {
        return this.fifoMap().keys();
    }

}).initThisClass();

module.exports = SvDbCache;