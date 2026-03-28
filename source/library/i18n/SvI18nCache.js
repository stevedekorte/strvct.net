"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18nCache
 * @extends ProtoClass
 * @classdesc Eager in-memory translation cache for the current language.
 * Owns a per-language IndexedDB (e.g. "i18nTranslations/cache/fr").
 * Loads all entries from its database into a Map on language select.
 * Seed entries (no timestamp) are permanent and never evicted.
 * Runtime entries (with timestamp) are evictable by FIFO when the entry count
 * exceeds the high water mark (3× seed count, or highWaterMarkDefault if no seed).
 *
 * Value format:
 *   Seed entry:    { t: "translation" }
 *   Runtime entry: { t: "translation", ts: 1711382400000 }
 *
 * IndexedDB key: source English text (language is encoded in the database path).
 */

(class SvI18nCache extends ProtoClass {

    initPrototypeSlots () {

        /**
         * @member {Map} entries
         * @description In-memory lookup: sourceText → { t, ts? }
         * @category Storage
         */
        {
            const slot = this.newSlot("entries", null);
            slot.setSlotType("Map");
        }

        /**
         * @member {Number} seedCount
         * @description Number of seed entries (no timestamp). Used to calculate high water mark.
         * @category Eviction
         */
        {
            const slot = this.newSlot("seedCount", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} highWaterMultiplier
         * @description Multiplier for seed count to get the high water mark.
         * @category Eviction
         */
        {
            const slot = this.newSlot("highWaterMultiplier", 3);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} highWaterMarkDefault
         * @description Minimum high water mark when no seed is loaded (seedCount is 0).
         * Prevents premature eviction of runtime translations before a seed exists.
         * @category Eviction
         */
        {
            const slot = this.newSlot("highWaterMarkDefault", 1000);
            slot.setSlotType("Number");
        }

        /**
         * @member {SvIndexedDbFolder} idb
         * @description Per-language IndexedDB. Path: "i18nTranslations/cache/{lang}".
         * @category Storage
         */
        {
            const slot = this.newSlot("idb", null);
            slot.setSlotType("SvIndexedDbFolder");
        }

        /**
         * @member {String} language
         * @description The language code this cache is currently loaded for.
         * @category State
         */
        {
            const slot = this.newSlot("language", null);
            slot.setSlotType("String");
        }
    }

    init () {
        super.init();
        this.setEntries(new Map());
        return this;
    }

    /**
     * @description Returns the IndexedDB path for a given language.
     * @param {String} language - ISO 639-1 code.
     * @returns {String}
     * @category Storage
     */
    idbPathForLanguage (language) {
        return "i18nTranslations/cache/" + language;
    }

    /**
     * @description Returns the eviction threshold. Runtime entries are evicted when
     * total entry count exceeds this value. Falls back to highWaterMarkDefault
     * when no seed is loaded.
     * @returns {Number}
     * @category Eviction
     */
    highWaterMark () {
        return Math.max(this.highWaterMarkDefault(), this.seedCount() * this.highWaterMultiplier());
    }

    /**
     * @description Serializes a value object to a JSON string for IndexedDB storage.
     * SvIndexedDbFolder only accepts string or ArrayBuffer values.
     * @param {Object} value - The value object { t, ts? }.
     * @returns {String}
     * @category Serialization
     * @private
     */
    serializeValue (value) {
        return JSON.stringify(value);
    }

    /**
     * @description Deserializes a JSON string from IndexedDB to a value object.
     * @param {String} str - The stored JSON string.
     * @returns {Object} The value object { t, ts? }.
     * @category Serialization
     * @private
     */
    deserializeValue (str) {
        return JSON.parse(str);
    }

    /**
     * @description Safely deserializes a stored value, handling legacy formats.
     * Old entries may be plain translation strings; new entries are JSON objects.
     * @param {String} stored - The stored value from IndexedDB.
     * @returns {Object|null} The value object { t, ts? }, or null if invalid.
     * @category Serialization
     * @private
     */
    safeDeserialize (stored) {
        if (typeof stored !== "string" || stored.length === 0) {
            return null;
        }

        // New format: JSON string starting with "{"
        if (stored.charAt(0) === "{") {
            try {
                return this.deserializeValue(stored);
            } catch (e) {
                console.warn("[SvI18nCache] safeDeserialize error:", e);
                return null;
            }
        }

        // Legacy format: plain translation string — migrate to new format
        return { t: stored };
    }

    // --- Database Lifecycle ---

    /**
     * @description Closes the current IndexedDB (if open) and opens a new one
     * for the given language. Loads all entries into the in-memory Map.
     * @param {String} language - ISO 639-1 code.
     * @returns {Promise<void>}
     * @category Loading
     */
    async asyncOpenForLanguage (language) {
        // Close previous database if switching languages
        if (this.idb()) {
            this.idb().close();
            this.setIdb(null);
        }

        this.setLanguage(language);
        this.entries().clear();
        this.setSeedCount(0);

        // Open per-language database
        const idb = SvIndexedDbFolder.clone();
        idb.setPath(this.idbPathForLanguage(language));
        this.setIdb(idb);
        await idb.promiseOpen();

        // Load all entries (everything in this DB is for this language)
        const allEntries = await idb.promiseAsMap();
        let seedCount = 0;

        allEntries.forEach((serialized, key) => {
            const value = this.safeDeserialize(serialized);
            if (value) {
                this.entries().set(key, value);
                if (!value.ts) {
                    seedCount++;
                }
            }
        });

        this.setSeedCount(seedCount);
        this.evictIfNeeded();

        console.log("[SvI18nCache] Loaded " + this.entries().size +
            " entries for " + language + " (" + seedCount + " seed)");
    }

    // --- Lookup ---

    /**
     * @description Synchronous lookup in the in-memory Map.
     * @param {String} text - Source English text.
     * @returns {String|null} Translation or null on miss.
     * @category Lookup
     */
    lookup (text) {
        const entry = this.entries().get(text);
        return entry ? entry.t : null;
    }

    // --- Storage ---

    /**
     * @description Stores a runtime translation in the Map and IndexedDB.
     * Runtime entries have a timestamp and are evictable by FIFO.
     * @param {String} text - Source English text (used as the key).
     * @param {String} translation - Translated text.
     * @returns {SvI18nCache}
     * @category Storage
     */
    store (text, translation) {
        const value = { t: translation, ts: Date.now() };
        this.entries().set(text, value);

        // Persist to IndexedDB (fire-and-forget)
        const idb = this.idb();
        if (idb && idb.isOpen()) {
            idb.promiseAtPut(text, this.serializeValue(value)).catch(e => {
                console.warn("[SvI18nCache] persist error:", e);
            });
        }

        this.evictIfNeeded();
        return this;
    }

    // --- Seed Loading ---

    /**
     * @description Loads seed entries from a JSON object into the Map and IndexedDB.
     * Seed entries have no timestamp (permanent, never evicted).
     * @param {Object} seedJson - { meta: { language, entryCount }, entries: { context: { source: translation } } }
     * @returns {SvI18nCache}
     * @category Seed
     */
    loadSeedJson (seedJson) {
        const entries = seedJson.entries;
        const idb = this.idb();
        let seedCount = 0;

        Object.keys(entries).forEach(context => {
            const contextEntries = entries[context];
            Object.keys(contextEntries).forEach(sourceText => {
                const translation = contextEntries[sourceText];
                const value = { t: translation }; // No timestamp = seed = permanent
                this.entries().set(sourceText, value);
                seedCount++;

                // Persist to IndexedDB (fire-and-forget)
                if (idb && idb.isOpen()) {
                    idb.promiseAtPut(sourceText, this.serializeValue(value)).catch(e => {
                        console.warn("[SvI18nCache] seed persist error:", e);
                    });
                }
            });
        });

        this.setSeedCount(seedCount);
        console.log("[SvI18nCache] Loaded " + seedCount + " seed entries for " + this.language());
        return this;
    }

    // --- Eviction ---

    /**
     * @description FIFO eviction of timestamped (runtime) entries when over high water mark.
     * Seed entries (no timestamp) are never evicted.
     * @category Eviction
     */
    evictIfNeeded () {
        const hwm = this.highWaterMark();
        if (this.entries().size <= hwm) {
            return;
        }

        // Collect timestamped entries sorted by timestamp (oldest first)
        const timestamped = [];
        this.entries().forEach((value, key) => {
            if (value.ts) {
                timestamped.push({ key: key, ts: value.ts });
            }
        });

        timestamped.sort((a, b) => a.ts - b.ts);

        // Evict oldest until we're at or below the high water mark
        const excess = this.entries().size - hwm;
        const toEvict = timestamped.slice(0, excess);

        toEvict.forEach(item => {
            this.entries().delete(item.key);
        });

        if (toEvict.length > 0) {
            console.log("[SvI18nCache] Evicted " + toEvict.length +
                " entries (hwm: " + hwm + ")");
        }
    }

    // --- Management ---

    /**
     * @description Clears all entries and deletes the per-language IndexedDB.
     * Used when a new seed version is available (wipe-and-replace).
     * @param {String} language - ISO 639-1 code.
     * @returns {Promise<void>}
     * @category Management
     */
    async clearForLanguage (language) {
        this.entries().clear();
        this.setSeedCount(0);

        // Close and delete the per-language database
        const idb = this.idb();
        if (idb) {
            idb.close();
            this.setIdb(null);
            await idb.promiseDelete();
        }

        console.log("[SvI18nCache] Cleared database for " + language);
    }

}).initThisClass();
