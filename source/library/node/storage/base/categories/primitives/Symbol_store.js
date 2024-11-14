"use strict";

/**
 * @module library.node.storage.base.categories.primitives
 * @class Symbol_store
 * @extends Symbol
 * @classdesc A category of Symbol with additional methods for storage and serialization.
 */
(class Symbol_store extends Symbol {

    static instanceFromRecordInStore (aRecord, aStore) {
        const obj = Symbol.for(aRecord.key);
        return obj;
    }

    /**
     * @description Returns a record object representing the object for storage.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Object} A record object representing the array for storage.
     * @category Serialization
     */
    recordForStore (aStore) { // should only be called by Store
        const symbolKey = Symbol.keyFor(sym);
        if (symbolKey !== undefined) {
            // Global symbol with a key, can be serialized safely
            const dict = { 
                type: 'Symbol', 
                key: symbolKey
            };
            return dict;
        } else if (sym.symbolKey) {
            // Unique symbol with a symbolKey, but cannot be fully reconstructed
            throw new Error("Cannot serialize a unique symbol (created with Symbol()).");
        } else {
            throw new Error("Cannot serialize an anonymous unique symbol without a symbolKey.");
        }
    }

    /**
     * @description Does nothing as instanceFromRecordInStore() handles deserialization.
     * @param {Object} aRecord - The record object to load from.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Array_store} The current instance.
     * @category Deserialization
     */
    loadFromRecord (aRecord, aStore) {
        return this;
    }

    /**
     * @description Does nothing as object is not a collection.
     * @param {Set} [puuids=new Set()] - A Set to store the collected PIDs.
     * @returns {Set} A Set of PIDs (Persistent Unique Identifiers) for JSON storage.
     * @category Serialization
     */
    refsPidsForJsonStore (puuids = new Set()) {
        return puuids;
    }

}).initThisCategory();