"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18n
 * @extends BaseNode
 * @classdesc Singleton coordinator for the i18n system.
 * Owns a dedicated IndexedDB for translations, shared between:
 *   - SvI18nCache (eager, in-memory Map for the current language)
 *   - SvI18nStore (async IndexedDB bridge for on-demand reads)
 *
 * Lookup order (from SvTranslatableNode):
 *   1. Node's translationMap (sync) → per-node FIFO cache of recent lookups
 *   2. SvI18nCache Map (sync) → all entries for current language
 *   3. SvI18nStore IndexedDB (async) → promotes hit to cache
 *   4. Queue for AI translation → stores result in cache + store
 *
 * Inactive when language is English. Clears caches on language change.
 *
 * Usage:
 *   SvI18n.shared().setCurrentLanguage("es");
 *   SvI18n.shared().cachedTranslate("Hit Points", "ui-label"); // → "Puntos de Golpe" or null
 *   SvI18n.shared().asyncTranslate("Hit Points", "ui-label").then(() => { ... });
 */

(class SvI18n extends BaseNode {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {

        /**
         * @member {String} currentLanguage
         * @description ISO 639-1 language code. "en" means no translation needed.
         */
        {
            const slot = this.newSlot("currentLanguage", "en");
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
         * @member {SvI18nCache} cache
         * @description Eager in-memory cache. Loads all entries for the current language.
         */
        {
            const slot = this.newSlot("cache", null);
            slot.setSlotType("SvI18nCache");
            slot.setShouldStoreSlot(false);
        }

        /**
         * @member {SvI18nService} service
         * @description Batched translation request service.
         */
        {
            const slot = this.newSlot("service", null);
            slot.setSlotType("SvI18nService");
            slot.setFinalInitProto(SvI18nService);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
        }

        /**
         * @member {Boolean} isEnabled
         * @description Master toggle. When false, translation is a pure passthrough.
         */
        {
            const slot = this.newSlot("isEnabled", false);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
         * @member {SvI18nStore} store
         * @description Async translation store backed by IndexedDB.
         */
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("SvI18nStore");
            slot.setShouldStoreSlot(false);
        }

        /**
         * @member {SvIndexedDbFolder} idb
         * @description Dedicated IndexedDB for all translations. Shared by cache and store.
         */
        {
            const slot = this.newSlot("idb", null);
            slot.setSlotType("SvIndexedDbFolder");
            slot.setShouldStoreSlot(false);
        }

        /**
         * @member {Map} pendingPromises
         * @description Map of key → Array of {resolve, reject} for pending async translations.
         */
        {
            const slot = this.newSlot("pendingPromises", null);
            slot.setSlotType("Map");
            slot.setShouldStoreSlot(false);
        }

        /**
         * @member {Set} pendingKeys
         * @description Keys currently awaiting translation (dedup guard).
         */
        {
            const slot = this.newSlot("pendingKeys", null);
            slot.setSlotType("Set");
            slot.setShouldStoreSlot(false);
        }

        // --- Status display slots (read-only, computed on access) ---

        /**
         * @member {Number} queuedCount
         * @description Number of strings awaiting translation. Computed live via getter override.
         */
        {
            const slot = this.newSlot("queuedCount", 0);
            slot.setSlotType("Number");
            slot.setCanEditInspection(false);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
        }

        /**
         * @member {Number} completedCount
         * @description Number of translations in the cache for the current language. Computed live via getter override.
         */
        {
            const slot = this.newSlot("completedCount", 0);
            slot.setSlotType("Number");
            slot.setCanEditInspection(false);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
        }
    }

    initPrototype () {
        this.setTitle("Internationalization");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    init () {
        super.init();
        this.setPendingPromises(new Map());
        this.setPendingKeys(new Set());
        return this;
    }

    /**
     * @description Creates the dedicated IndexedDB, cache, and store instances.
     * Called after init (and after any legacy data is loaded from ObjectPool).
     * Always creates fresh instances — we no longer persist these through ObjectPool.
     * @returns {SvI18n}
     * @category Lifecycle
     */
    finalInit () {
        super.finalInit();

        // Create dedicated IndexedDB for translations
        const idb = SvIndexedDbFolder.clone();
        idb.setPath("i18nTranslations");
        this.setIdb(idb);

        // Create cache and store, sharing the IDB reference
        const cache = SvI18nCache.clone();
        cache.setIdb(idb);
        this.setCache(cache);

        const store = SvI18nStore.clone();
        store.setIdb(idb);
        this.setStore(store);

        // Open IDB asynchronously — translations unavailable until this completes
        this.asyncOpen().catch(e => {
            console.warn("[SvI18n] failed to open:", e);
        });

        return this;
    }

    /**
     * @description Computed getter for queuedCount. Returns the number of strings
     * awaiting translation (service queue + in-flight + pending async lookups).
     * @returns {Number}
     * @category Status
     */
    queuedCount () {
        const service = this.service();
        return (service ? service.queuedCount() : 0) + this.pendingKeys().size;
    }

    /**
     * @description Computed getter for completedCount. Returns the number of
     * translations in the cache for the current language.
     * @returns {Number}
     * @category Status
     */
    completedCount () {
        const cache = this.cache();
        return cache ? cache.entries().size : 0;
    }

    subtitle () {
        const lang = this.currentLanguage();
        if (lang === "en") {
            return "disabled (English)";
        }
        const q = this.queuedCount();
        const c = this.completedCount();
        return lang + " — " + c + " translated" + (q > 0 ? ", " + q + " queued" : "");
    }

    // --- Lifecycle ---

    /**
     * @description Opens the IndexedDB and loads the cache for the current language.
     * @returns {Promise<void>}
     * @category Lifecycle
     */
    async asyncOpen () {
        await this.idb().promiseOpen();

        const lang = this.currentLanguage();
        if (lang !== "en") {
            await this.cache().asyncLoadForLanguage(lang);
        }
    }

    // --- Key Construction ---

    /**
     * @description Constructs a storage key from language and source text.
     * Used by both cache and store, and by the service for pending key tracking.
     * @param {String} text - Source English text.
     * @param {String} language - ISO 639-1 code.
     * @returns {String}
     * @category Keys
     */
    keyFor (text, language) {
        return language + ":" + text;
    }

    // --- Translation ---

    /**
     * @description Returns true if translation is needed (enabled and language is not English).
     * @returns {Boolean}
     * @category Translation
     */
    needsTranslation () {
        return this.isEnabled() && this.currentLanguage() !== "en";
    }

    /**
     * @description Synchronous translation lookup from the cache Map.
     * @param {String} text - Source English text.
     * @param {String} [context] - Context category (unused in key, kept for API compat).
     * @returns {String|null} The translated string, or null on cache miss.
     * @category Translation
     */
    cachedTranslate (text /*,context*/) {
        const language = this.currentLanguage();

        const cacheResult = this.cache().lookup(text, language);
        if (cacheResult !== null) {
            return cacheResult;
        }

        return null;
    }

    /**
     * @description Requests an async translation. Checks store IndexedDB first,
     * then falls back to AI translation. Returns a Promise that resolves when
     * the translation is available via cachedTranslate().
     * Deduplicates: if the same key is already pending, chains onto the existing request.
     * @param {String} text - Source English text.
     * @param {String} [context="ui-label"] - Context category (used for AI prompt quality).
     * @returns {Promise} Resolves when translation is available.
     * @category Translation
     */
    asyncTranslate (text, context) {
        if (!context) {
            context = "ui-label";
        }

        const language = this.currentLanguage();
        const key = this.keyFor(text, language);

        return new Promise((resolve, reject) => {
            // Add to pending promises list for this key
            if (!this.pendingPromises().has(key)) {
                this.pendingPromises().set(key, []);
            }
            this.pendingPromises().get(key).push({ resolve: resolve, reject: reject });

            // Only process if not already pending
            if (!this.pendingKeys().has(key)) {
                this.pendingKeys().add(key);

                // Try store IndexedDB first (async)
                this.store().asyncLookup(text, language).then(storeResult => {
                    if (storeResult !== null) {
                        // Found in IndexedDB — promote to cache for stable sync access
                        this.cache().store(text, language, storeResult);
                        this.pendingKeys().delete(key);
                        this.resolvePendingForKey(key);
                    } else {
                        // Not found anywhere — queue for AI translation
                        this.service().enqueue(text, context);
                    }
                }).catch(e => {
                    // IndexedDB lookup failed — queue AI translation anyway
                    console.warn("[SvI18n] store lookup failed, falling back to AI:", e);
                    this.service().enqueue(text, context);
                });
            }
        });
    }

    // --- Promise Resolution ---

    /**
     * @description Resolves all pending promises for a given key.
     * @param {String} key - The translation key.
     * @category Promises
     * @private
     */
    resolvePendingForKey (key) {
        const callbacks = this.pendingPromises().get(key);
        if (callbacks) {
            callbacks.forEach(cb => cb.resolve());
            this.pendingPromises().delete(key);
        }
    }

    /**
     * @description Called by SvI18nService when translations are stored.
     * Resolves all pending promises for the translated keys.
     * @param {Array} translatedKeys - Array of keys that were just translated.
     * @category Promises
     */
    resolveTranslations (translatedKeys) {
        translatedKeys.forEach(key => {
            this.pendingKeys().delete(key);
            this.resolvePendingForKey(key);
        });
    }

    /**
     * @description Called by SvI18nService when a translation request fails.
     * Rejects all pending promises for the failed keys.
     * @param {Array} failedKeys - Array of keys that failed.
     * @param {Error} error - The error.
     * @category Promises
     */
    rejectTranslations (failedKeys, error) {
        failedKeys.forEach(key => {
            this.pendingKeys().delete(key);
            const callbacks = this.pendingPromises().get(key);
            if (callbacks) {
                callbacks.forEach(cb => cb.reject(error));
                this.pendingPromises().delete(key);
            }
        });
    }

    // --- Language ---

    /**
     * @description Sets the current language and triggers cache/store reload.
     * @param {String} code - ISO 639-1 language code.
     * @returns {SvI18n}
     * @category Language
     */
    setCurrentLanguage (code) {
        const oldValue = this._currentLanguage;
        this._currentLanguage = code;

        if (oldValue !== code) {
            this.onLanguageChanged(code);
            this.postNoteNamed("svI18nLanguageChanged");
        }

        return this;
    }

    /**
     * @description Handles language change. Reloads the cache for the new language
     * from IndexedDB. Node translation maps auto-clear lazily on next access
     * when they detect the language has changed.
     * @param {String} newLang - The new language code.
     * @category Language
     * @private
     */
    onLanguageChanged (newLang) {
        // Reload cache for new language
        if (this.cache() && this.idb() && this.idb().isOpen()) {
            this.cache().asyncLoadForLanguage(newLang).catch(e => {
                console.warn("[SvI18n] failed to load cache for " + newLang + ":", e);
            });
        }
    }

}).initThisClass();
