"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18nCache
 * @extends SvStorableNode
 * @classdesc Persisted translation store. Stores SvI18nEntry instances as subnodes.
 * Uses an in-memory Map index for fast lookups, built from subnodes on load.
 */

(class SvI18nCache extends SvStorableNode {

    initPrototypeSlots () {

        /**
         * @member {Map} index
         * @description In-memory lookup index: cacheKey → SvI18nEntry.
         */
        {
            const slot = this.newSlot("index", null);
            slot.setSlotType("Map");
            slot.setShouldStoreSlot(false);
        }

        /**
         * @member {Set} pendingKeys
         * @description Keys currently awaiting translation (dedup).
         */
        {
            const slot = this.newSlot("pendingKeys", null);
            slot.setSlotType("Set");
            slot.setShouldStoreSlot(false);
        }
    }

    initPrototype () {
        this.setTitle("Translation Cache");
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([SvI18nEntry]);
        this.setNodeCanAddSubnode(false);
    }

    init () {
        super.init();
        this.setIndex(new Map());
        this.setPendingKeys(new Set());
        return this;
    }

    /**
     * @description Rebuilds the in-memory index from subnodes.
     * Call after loading from storage or importing seed data.
     * @returns {SvI18nCache}
     * @category Index
     */
    rebuildIndex () {
        const index = new Map();
        this.subnodes().forEach(entry => {
            index.set(entry.cacheKey(), entry);
        });
        this.setIndex(index);
        return this;
    }

    /**
     * @description localStorage key for persisting translations.
     * @returns {String}
     * @category Persistence
     */
    localStorageKey () {
        return "svi18n_cache";
    }

    /**
     * @description Called after loading from storage. Loads cached translations from localStorage.
     * @returns {SvI18nCache}
     */
    finalInit () {
        super.finalInit();
        this.loadFromLocalStorage();
        return this;
    }

    /**
     * @description Saves all translations to localStorage as JSON.
     * @returns {SvI18nCache}
     * @category Persistence
     */
    saveToLocalStorage () {
        if (typeof localStorage === "undefined") {
            return this;
        }

        const data = {};
        this.index().forEach((entry, key) => {
            data[key] = {
                sourceText: entry.sourceText(),
                targetText: entry.targetText(),
                targetLanguage: entry.targetLanguage(),
                context: entry.context(),
                sourceHash: entry.sourceHash(),
                timestamp: entry.timestamp()
            };
        });

        try {
            localStorage.setItem(this.localStorageKey(), JSON.stringify(data));
            console.log("[i18n] cache saved to localStorage: " + Object.keys(data).length + " entries");
        } catch (e) {
            console.warn("[i18n] failed to save cache to localStorage:", e.message);
        }

        return this;
    }

    /**
     * @description Debounces saves to localStorage so batch stores don't trigger multiple writes.
     * @returns {SvI18nCache}
     * @category Persistence
     */
    scheduleSaveToLocalStorage () {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
        }
        this._saveTimer = setTimeout(() => {
            this._saveTimer = null;
            this.saveToLocalStorage();
        }, 500);
        return this;
    }

    /**
     * @description Loads translations from localStorage and populates the in-memory index.
     * @returns {SvI18nCache}
     * @category Persistence
     */
    loadFromLocalStorage () {
        if (typeof localStorage === "undefined") {
            return this;
        }

        try {
            const json = localStorage.getItem(this.localStorageKey());
            if (!json) {
                return this;
            }

            const data = JSON.parse(json);
            const keys = Object.keys(data);
            let count = 0;

            keys.forEach(key => {
                const d = data[key];
                const entry = SvI18nEntry.clone();
                entry.setSourceText(d.sourceText);
                entry.setTargetText(d.targetText);
                entry.setTargetLanguage(d.targetLanguage);
                entry.setContext(d.context);
                entry.setSourceHash(d.sourceHash);
                entry.setTimestamp(d.timestamp);
                this.addSubnode(entry);
                this.index().set(key, entry);
                count++;
            });

            console.log("[i18n] cache loaded from localStorage: " + count + " entries");
        } catch (e) {
            console.warn("[i18n] failed to load cache from localStorage:", e.message);
        }

        return this;
    }

    /**
     * @description Looks up a translation in the cache.
     * @param {String} text - Source English text.
     * @param {String} language - Target language code.
     * @param {String} context - Context category.
     * @returns {String|null} The translated string, or null on cache miss.
     * @category Lookup
     */
    lookup (text, language, context) {
        const key = SvI18nEntry.cacheKeyFor(text, language, context);
        const entry = this.index().get(key);
        if (entry) {
            if (entry.isStale(text)) {
                // Source text changed — treat as cache miss
                return null;
            }
            return entry.targetText();
        }
        return null;
    }

    /**
     * @description Stores a translation in the cache.
     * @param {String} text - Source English text.
     * @param {String} language - Target language code.
     * @param {String} context - Context category.
     * @param {String} translation - The translated string.
     * @returns {SvI18nEntry} The created or updated entry.
     * @category Storage
     */
    store (text, language, context, translation) {
        const key = SvI18nEntry.cacheKeyFor(text, language, context);
        let entry = this.index().get(key);

        if (entry) {
            // Update existing entry
            entry.setTargetText(translation);
            entry.setSourceHash(SvI18nEntry.hashString(text));
            entry.setTimestamp(Date.now());
        } else {
            // Create new entry
            entry = SvI18nEntry.clone();
            entry.setSourceText(text);
            entry.setTargetText(translation);
            entry.setTargetLanguage(language);
            entry.setContext(context);
            entry.setSourceHash(SvI18nEntry.hashString(text));
            entry.setTimestamp(Date.now());
            this.addSubnode(entry);
            this.index().set(key, entry);
        }

        // Remove from pending
        this.pendingKeys().delete(key);

        // Debounce save to localStorage
        this.scheduleSaveToLocalStorage();

        return entry;
    }

    /**
     * @description Checks if a key is already pending translation.
     * @param {String} text - Source text.
     * @param {String} language - Target language code.
     * @param {String} context - Context category.
     * @returns {Boolean}
     * @category Pending
     */
    hasPending (text, language, context) {
        const key = SvI18nEntry.cacheKeyFor(text, language, context);
        return this.pendingKeys().has(key);
    }

    /**
     * @description Marks a key as pending translation.
     * @param {String} text - Source text.
     * @param {String} language - Target language code.
     * @param {String} context - Context category.
     * @returns {SvI18nCache}
     * @category Pending
     */
    addPending (text, language, context) {
        const key = SvI18nEntry.cacheKeyFor(text, language, context);
        this.pendingKeys().add(key);
        return this;
    }

    /**
     * @description Loads translations from a seed JSON object.
     * @param {Object} json - Seed file JSON with entries grouped by context.
     * @returns {SvI18nCache}
     * @category Import
     */
    loadSeedJson (json) {
        const language = json.meta.language;
        const entries = json.entries;

        Object.keys(entries).forEach(context => {
            const contextEntries = entries[context];
            Object.keys(contextEntries).forEach(sourceText => {
                const translation = contextEntries[sourceText];
                this.store(sourceText, language, context, translation);
            });
        });

        return this;
    }

    /**
     * @description Exports all entries for a language as a seed-format JSON object.
     * @param {String} language - Target language code.
     * @returns {Object} Seed file JSON.
     * @category Export
     */
    exportJson (language) {
        const entries = {};
        let count = 0;

        this.subnodes().forEach(entry => {
            if (entry.targetLanguage() === language) {
                const context = entry.context();
                if (!entries[context]) {
                    entries[context] = {};
                }
                entries[context][entry.sourceText()] = entry.targetText();
                count++;
            }
        });

        return {
            meta: {
                language: language,
                exported: new Date().toISOString(),
                entryCount: count
            },
            entries: entries
        };
    }

    /**
     * @description Removes all entries for a language, or all entries if no language specified.
     * @param {String} [language] - Target language code, or undefined for all.
     * @returns {SvI18nCache}
     * @category Management
     */
    clear (language) {
        if (language) {
            const toRemove = this.subnodes().filter(entry => entry.targetLanguage() === language);
            toRemove.forEach(entry => this.removeSubnode(entry));
        } else {
            this.removeAllSubnodes();
        }
        this.rebuildIndex();
        this.saveToLocalStorage();
        return this;
    }

    /**
     * @description Returns the number of entries for a given language.
     * @param {String} language - Target language code.
     * @returns {Number}
     * @category Info
     */
    entryCountForLanguage (language) {
        return this.subnodes().filter(entry => entry.targetLanguage() === language).length;
    }

    /**
     * @description Returns subtitle showing entry count.
     * @returns {String}
     */
    subtitle () {
        return this.subnodes().length + " translations";
    }

}).initThisClass();
