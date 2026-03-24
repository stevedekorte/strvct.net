"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18nStore
 * @extends ProtoClass
 * @classdesc Dedicated IndexedDB store for translation caching.
 * Separate from the main object pool to avoid loading all translations
 * into memory at startup. Uses SvIndexedDbFolder directly with async
 * reads/writes, following the same pattern as SvBlobPool.
 *
 * Two-layer lookup:
 * 1. In-memory seed map (synchronous) — shared translations from pool.json
 * 2. IndexedDB (async) — user-specific and overflow translations
 *
 * Keys are plain text: "{language}:{sourceText}"
 *
 * Usage:
 *   await SvI18nStore.shared().asyncOpen();
 *   SvI18nStore.shared().loadSeedMap(poolJson);
 *   const t = SvI18nStore.shared().seedLookup("Hit Points", "es"); // sync
 *   const t = await SvI18nStore.shared().asyncLookup("some text", "es"); // async
 */

(class SvI18nStore extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {

        /**
         * @member {SvIndexedDbFolder} idb
         * @description IndexedDB folder for persistent translation storage.
         * @category Storage
         */
        {
            const slot = this.newSlot("idb", null);
            slot.setSlotType("SvIndexedDbFolder");
        }

        /**
         * @member {Boolean} isOpen
         * @description Whether the store is open and ready.
         * @category State
         */
        {
            const slot = this.newSlot("isOpen", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Map} seedMap
         * @description In-memory map of shared translations loaded from pool.json.
         * Keys: "{language}:{sourceText}", Values: translated text.
         * @category Cache
         */
        {
            const slot = this.newSlot("seedMap", null);
            slot.setSlotType("Map");
        }

        /**
         * @member {String} seedVersion
         * @description The version (ETag or timestamp) of the last loaded seed pool.
         * Stored in localStorage for quick metadata comparison on cold start.
         * @category Versioning
         */
        {
            const slot = this.newSlot("seedVersion", null);
            slot.setSlotType("String");
        }
    }

    init () {
        super.init();
        this.setIdb(SvIndexedDbFolder.clone());
        this.setSeedMap(new Map());
    }

    // --- Key Construction ---

    /**
     * @description Constructs a storage key from language and source text.
     * @param {String} text - The source English text.
     * @param {String} language - ISO 639-1 language code.
     * @returns {String} The composite key.
     * @category Keys
     */
    keyFor (text, language) {
        return language + ":" + text;
    }

    // --- Open/Close ---

    /**
     * @description Opens the translation store database.
     * @async
     * @returns {Promise<void>}
     * @category Lifecycle
     */
    async asyncOpen () {
        if (this.isOpen()) {
            return;
        }

        this.idb().setPath("i18nTranslations");
        await this.idb().promiseOpen();
        this.setIsOpen(true);
        this.loadSeedVersion();
    }

    /**
     * @description Asserts that the store is open.
     * @private
     * @category Validation
     */
    assertOpen () {
        assert(this.isOpen(), "SvI18nStore is not open — call asyncOpen() first");
    }

    // --- Seed Map (Layer 1: synchronous) ---

    /**
     * @description Loads shared translations from a pool.json object into the in-memory seed map.
     * @param {Object} poolJson - The pool JSON: { meta: {...}, entries: { "English": "Translation", ... } }
     * @param {String} language - The language code for these translations.
     * @returns {SvI18nStore}
     * @category Seed
     */
    loadSeedMap (poolJson, language) {
        const entries = poolJson.entries;
        const map = this.seedMap();

        Object.keys(entries).forEach(sourceText => {
            const key = this.keyFor(sourceText, language);
            map.set(key, entries[sourceText]);
        });

        return this;
    }

    /**
     * @description Synchronous lookup in the in-memory seed map.
     * @param {String} text - The source English text.
     * @param {String} language - ISO 639-1 language code.
     * @returns {String|null} The translation, or null on miss.
     * @category Seed
     */
    seedLookup (text, language) {
        const key = this.keyFor(text, language);
        const value = this.seedMap().get(key);
        return value !== undefined ? value : null;
    }

    // --- Seed Versioning ---

    /**
     * @description Loads the stored seed version from localStorage.
     * @category Versioning
     * @private
     */
    loadSeedVersion () {
        try {
            const version = localStorage.getItem("svI18nSeedVersion");
            if (version) {
                this.setSeedVersion(version);
            }
        } catch (e) {
            // localStorage unavailable — no cached version
        }
    }

    /**
     * @description Saves the current seed version to localStorage.
     * @param {String} version - The version string (ETag or timestamp).
     * @category Versioning
     */
    storeSeedVersion (version) {
        this.setSeedVersion(version);
        try {
            localStorage.setItem("svI18nSeedVersion", version);
        } catch (e) {
            // localStorage unavailable — version won't persist
        }
    }

    // --- IndexedDB (Layer 2: async) ---

    /**
     * @description Async lookup in IndexedDB.
     * @param {String} text - The source English text.
     * @param {String} language - ISO 639-1 language code.
     * @returns {Promise<String|null>} The translation, or null on miss.
     * @category Storage
     */
    async asyncLookup (text, language) {
        this.assertOpen();
        const key = this.keyFor(text, language);
        const value = await this.idb().promiseAt(key);
        return value !== undefined ? value : null;
    }

    /**
     * @description Stores a translation in IndexedDB.
     * @param {String} text - The source English text.
     * @param {String} language - ISO 639-1 language code.
     * @param {String} translation - The translated text.
     * @returns {Promise<void>}
     * @category Storage
     */
    async asyncStore (text, language, translation) {
        this.assertOpen();
        const key = this.keyFor(text, language);
        await this.idb().promiseAtPut(key, translation);
    }

    // --- Combined Lookup ---

    /**
     * @description Two-layer lookup: seed map (sync), then IndexedDB (async).
     * Returns the translation synchronously if in the seed map,
     * otherwise returns a Promise that resolves to the translation or null.
     * @param {String} text - The source English text.
     * @param {String} language - ISO 639-1 language code.
     * @returns {String|null} Translation from seed map, or null (caller should try asyncLookup).
     * @category Lookup
     */
    syncLookup (text, language) {
        return this.seedLookup(text, language);
    }

}).initThisClass();
