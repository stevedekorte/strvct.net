"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvI18nStore
 * @extends ProtoClass
 * @classdesc Async translation store backed by IndexedDB.
 * Provides on-demand async lookups and fire-and-forget persistence.
 * Results from IndexedDB lookups are promoted to SvI18nCache by SvI18n.
 *
 * Shares the same IndexedDB as SvI18nCache (owned by SvI18n).
 * Handles translations that are not in the eager cache — typically longer
 * or less common strings that were evicted or never loaded into the cache.
 *
 * Value format in IndexedDB (serialized as JSON string):
 *   { t: "translation", ts: 1711382400000 }
 *
 * IndexedDB key format: "lang:sourceText"
 */

(class SvI18nStore extends ProtoClass {

    initPrototypeSlots () {

        /**
         * @member {SvIndexedDbFolder} idb
         * @description Shared IndexedDB folder reference (owned by SvI18n).
         * @category Storage
         */
        {
            const slot = this.newSlot("idb", null);
            slot.setSlotType("SvIndexedDbFolder");
        }
    }

    /**
     * @description Constructs a storage key.
     * @param {String} text - Source English text.
     * @param {String} language - ISO 639-1 code.
     * @returns {String}
     * @category Keys
     */
    keyFor (text, language) {
        return language + ":" + text;
    }

    /**
     * @description Serializes a value object to a JSON string for IndexedDB storage.
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

        if (stored.charAt(0) === "{") {
            try {
                return this.deserializeValue(stored);
            } catch (e) {
                return null;
            }
        }

        // Legacy format: plain translation string
        return { t: stored };
    }

    // --- Lookup ---

    /**
     * @description Async lookup from IndexedDB.
     * @param {String} text - Source English text.
     * @param {String} language - ISO 639-1 code.
     * @returns {Promise<String|null>} Translation or null.
     * @category Lookup
     */
    async asyncLookup (text, language) {
        const idb = this.idb();
        if (!idb || !idb.isOpen()) {
            return null;
        }

        const key = this.keyFor(text, language);
        const value = await idb.promiseAt(key);

        if (value !== undefined && value !== null) {
            const parsed = this.safeDeserialize(value);
            return parsed ? parsed.t : null;
        }

        return null;
    }

    // --- Storage ---

    /**
     * @description Persists a translation to IndexedDB (fire-and-forget).
     * @param {String} text - Source English text.
     * @param {String} language - ISO 639-1 code.
     * @param {String} translation - Translated text.
     * @returns {SvI18nStore}
     * @category Storage
     */
    storeSync (text, language, translation) {
        const key = this.keyFor(text, language);
        const value = { t: translation, ts: Date.now() };

        const idb = this.idb();
        if (idb && idb.isOpen()) {
            idb.promiseAtPut(key, this.serializeValue(value)).catch(e => {
                console.warn("[SvI18nStore] persist error:", e);
            });
        }

        return this;
    }

}).initThisClass();
