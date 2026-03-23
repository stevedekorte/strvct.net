"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18nCache
 * @extends SvStorableNode
 * @classdesc Persisted translation store. Stores SvI18nEntry instances as subnodes,
 * persisted via the STRVCT object pool (IndexedDB). Uses an in-memory Map index
 * for fast lookups, rebuilt from subnodes on load.
 */

(class SvI18nCache extends SvStorableNode {

    initPrototypeSlots () {

        /**
         * @member {Map} index
         * @description In-memory lookup index: cacheKey → SvI18nEntry.
         * Rebuilt from subnodes on load — not stored.
         */
        {
            const slot = this.newSlot("index", null);
            slot.setSlotType("Map");
            slot.setShouldStoreSlot(false);
        }

        /**
         * @member {Set} pendingKeys
         * @description Keys currently awaiting translation (dedup). Runtime state only.
         */
        {
            const slot = this.newSlot("pendingKeys", null);
            slot.setSlotType("Set");
            slot.setShouldStoreSlot(false);
        }
    }

    initPrototype () {
        this.setTitle("Translation Cache");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
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
     * @description Called after loading from storage. Rebuilds the in-memory index from subnodes.
     * @returns {SvI18nCache}
     */
    finalInit () {
        super.finalInit();
        this.rebuildIndex();
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
