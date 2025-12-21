"use strict";

/** * @module library.node.storage.base.categories.primitives
 */

/** * @class Array_store
 * @extends Array
 * @classdesc An Array category with additional methods for storage and serialization.
 
 
 */

/**

 */
(class Array_store extends Array {

    /**
     * @static
     * @description Gets the length of the array in the record object.
     * @param {Object} aRecordObj - The record object containing the array values.
     * @returns {number} The length of the array in the record object.
     * @category Utility
     */
    static lengthOfRecord (aRecordObj) {
        return aRecordObj.values.length;
    }

    /**
     * @description Prepares the array for storage by creating a record object.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Object} A record object representing the array for storage.
     * @category Serialization
     */
    recordForStore (aStore) { // should only be called by Store
        const dict = {
            type: Type.typeName(this),
            values: this.map(v => aStore.refValue(v))
        };

        return dict;
    }

    /**
     * @description Loads the array from a record object.
     * @param {Object} aRecord - The record object to load from.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Array_store} The current instance after loading the values.
     * @category Deserialization
     */
    loadFromRecord (aRecord, aStore) {
        const loadedValues = aRecord.values.map(v => aStore.unrefValue(v));
        if (this.unhooked_push) {
            loadedValues.forEach(v => this.unhooked_push(v));
        } else {
            loadedValues.forEach(v => this.push(v));
        }
        return this;
    }

    /**
     * @description Collects PIDs for all non-null elements in the array.
     * @param {Set} [puuids=new Set()] - A Set to store the collected PIDs.
     * @returns {Set} A Set of PIDs (Persistent Unique Identifiers) for JSON storage.
     * @category Serialization
     */
    refsPidsForJsonStore (puuids = new Set()) {
        this.forEach(v => {
            if (!Type.isNull(v)) {
                v.refsPidsForJsonStore(puuids);
            }
        });
        return puuids;
    }

}).initThisCategory();
