"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18nEntry
 * @extends SvStorableNode
 * @classdesc Individual translation record. Stored as subnode of SvI18nCache.
 */

(class SvI18nEntry extends SvStorableNode {

    initPrototypeSlots () {

        /**
         * @member {String} sourceText
         * @description Original English text.
         */
        {
            const slot = this.newSlot("sourceText", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        /**
         * @member {String} targetText
         * @description Translated text.
         */
        {
            const slot = this.newSlot("targetText", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        /**
         * @member {String} targetLanguage
         * @description ISO 639-1 language code (e.g. "es", "ja").
         */
        {
            const slot = this.newSlot("targetLanguage", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {String} context
         * @description Translation context category (e.g. "ui-label", "game-mechanic").
         */
        {
            const slot = this.newSlot("context", "ui-label");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {String} sourceHash
         * @description Hash of sourceText for staleness detection.
         */
        {
            const slot = this.newSlot("sourceHash", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {Number} timestamp
         * @description When this translation was created/updated (ms since epoch).
         */
        {
            const slot = this.newSlot("timestamp", 0);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Returns title for inspector display.
     * @returns {String}
     */
    title () {
        return this.sourceText();
    }

    /**
     * @description Returns subtitle for inspector display.
     * @returns {String}
     */
    subtitle () {
        return this.targetLanguage() + ": " + this.targetText();
    }

    /**
     * @description Generates a simple hash of a string.
     * @param {String} str - The string to hash.
     * @returns {String} A hex hash string.
     * @category Hashing
     */
    static hashString (str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * @description Checks whether the source text has changed since this translation was made.
     * @param {String} currentSourceText - The current English source text.
     * @returns {Boolean} True if the translation is stale.
     * @category Staleness
     */
    isStale (currentSourceText) {
        return this.sourceHash() !== SvI18nEntry.hashString(currentSourceText);
    }

    /**
     * @description Checks if this entry matches a given lookup key.
     * @param {String} text - Source text.
     * @param {String} language - Target language code.
     * @param {String} context - Context category.
     * @returns {Boolean}
     * @category Lookup
     */
    matchesKey (text, language, context) {
        return this.sourceText() === text &&
               this.targetLanguage() === language &&
               this.context() === context;
    }

    /**
     * @description Returns the cache key string for this entry.
     * @returns {String}
     * @category Lookup
     */
    cacheKey () {
        return SvI18nEntry.cacheKeyFor(this.sourceText(), this.targetLanguage(), this.context());
    }

    /**
     * @description Builds a cache key from components.
     * @param {String} text - Source text.
     * @param {String} language - Target language code.
     * @param {String} context - Context category.
     * @returns {String}
     * @category Lookup
     */
    static cacheKeyFor (text, language, context) {
        return text + "/" + language + "/" + context;
    }

}).initThisClass();
