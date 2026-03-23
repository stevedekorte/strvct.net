"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18n
 * @extends SvNode
 * @classdesc Singleton coordinator for the i18n system.
 * Holds the current language, the translation cache, and the translation service.
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
        }

        /**
         * @member {SvI18nCache} cache
         * @description Persistent translation cache.
         */
        {
            const slot = this.newSlot("cache", null);
            slot.setSlotType("SvI18nCache");
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SvI18nCache);
            slot.setIsSubnodeField(true);
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
        }

        /**
         * @member {Map} pendingPromises
         * @description Map of cacheKey → Array of {resolve, reject} for pending async translations.
         */
        {
            const slot = this.newSlot("pendingPromises", null);
            slot.setSlotType("Map");
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
        return this;
    }

    /**
     * @description Returns true if translation is needed (enabled and language is not English).
     * @returns {Boolean}
     * @category Translation
     */
    needsTranslation () {
        return this.isEnabled() && this.currentLanguage() !== "en";
    }

    /**
     * @description Synchronous cache lookup. Returns the translated string or null on cache miss.
     * @param {String} text - Source English text.
     * @param {String} [context="ui-label"] - The context category.
     * @returns {String|null} The translated string, or null on cache miss.
     * @category Translation
     */
    cachedTranslate (text, context) {
        if (!context) {
            context = "ui-label";
        }
        const language = this.currentLanguage();
        return this.cache().lookup(text, language, context);
    }

    /**
     * @description Requests an async translation. Returns a Promise that resolves when
     * the translation is cached and available via cachedTranslate().
     * Deduplicates: if the same string is already pending, returns a promise
     * that chains onto the existing request.
     * @param {String} text - Source English text.
     * @param {String} [context="ui-label"] - The context category.
     * @returns {Promise} Resolves when translation is cached.
     * @category Translation
     */
    asyncTranslate (text, context) {
        if (!context) {
            context = "ui-label";
        }

        const language = this.currentLanguage();
        const key = SvI18nEntry.cacheKeyFor(text, language, context);

        return new Promise((resolve, reject) => {
            // Add to pending promises list for this key
            if (!this.pendingPromises().has(key)) {
                this.pendingPromises().set(key, []);
            }
            this.pendingPromises().get(key).push({ resolve: resolve, reject: reject });

            // Only enqueue if not already pending in the service
            if (!this.cache().hasPending(text, language, context)) {
                this.cache().addPending(text, language, context);
                this.service().enqueue(text, context);
            }
        });
    }

    /**
     * @description Called by SvI18nService when translations are stored in the cache.
     * Resolves all pending promises for the translated keys.
     * @param {Array} translatedKeys - Array of cache keys that were just translated.
     * @category Promises
     */
    resolveTranslations (translatedKeys) {
        translatedKeys.forEach(key => {
            const callbacks = this.pendingPromises().get(key);
            if (callbacks) {
                callbacks.forEach(cb => cb.resolve());
                this.pendingPromises().delete(key);
            }
        });
    }

    /**
     * @description Called by SvI18nService when a translation request fails.
     * Rejects all pending promises for the failed keys.
     * @param {Array} failedKeys - Array of cache keys that failed.
     * @param {Error} error - The error.
     * @category Promises
     */
    rejectTranslations (failedKeys, error) {
        failedKeys.forEach(key => {
            const callbacks = this.pendingPromises().get(key);
            if (callbacks) {
                callbacks.forEach(cb => cb.reject(error));
                this.pendingPromises().delete(key);
            }
        });
    }

    /**
     * @description Sets the current language and triggers a UI refresh.
     * @param {String} code - ISO 639-1 language code.
     * @returns {SvI18n}
     * @category Language
     */
    setCurrentLanguage (code) {
        const oldValue = this._currentLanguage;
        this._currentLanguage = code;

        if (oldValue !== code) {
            // Notify views to re-render with new language
            this.postNoteNamed("svI18nLanguageChanged");
        }

        return this;
    }

}).initThisClass();
