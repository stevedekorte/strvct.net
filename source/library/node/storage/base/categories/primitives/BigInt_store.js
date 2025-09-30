"use strict";

/**
 * @module library.node.storage.base.categories.primitives
 * @class BigInt_store
 * @extends BigInt
 * @classdesc A category of BigInt with additional methods for storage and serialization.
 */
(class BigInt_store extends BigInt {

    static instanceFromRecordInStore (aRecord, aStore) {
        const obj = BigInt(aRecord.value);
        return obj;
    }

    /**
     * @description Returns a record object representing the BigInt for storage.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Object} A record object representing the array for storage.
     * @category Serialization
     */
    recordForStore (aStore) { // should only be called by Store
        const dict = {
            type: "BigInt", // TODO: fix this to support subclasses
            value: this.toString()
        };

        return dict;
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
     * @description Does nothing as BigInt is not a collection.
     * @param {Set} [puuids=new Set()] - A Set to store the collected PIDs.
     * @returns {Set} A Set of PIDs (Persistent Unique Identifiers) for JSON storage.
     * @category Serialization
     */
    refsPidsForJsonStore (puuids = new Set()) {
        return puuids;
    }

}).initThisCategory();
