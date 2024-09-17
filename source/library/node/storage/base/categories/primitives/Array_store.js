"use strict";

/**
 * @module node.storage.base
 * @class Array_store
 * @extends Array
 * @description A custom Array class with additional methods for storage and serialization.
 */
(class Array_store extends Array {

    /**
     * @static
     * @param {Object} aRecordObj - The record object containing the array values.
     * @returns {number} The length of the array in the record object.
     */
    static lengthOfRecord (aRecordObj) {
        return aRecordObj.values.length
    }

    /**
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Object} A record object representing the array for storage.
     * @description Prepares the array for storage by creating a record object.
     */
    recordForStore (aStore) { // should only be called by Store
        const dict = {
            type: Type.typeName(this), 
            values: this.map(v => aStore.refValue(v))
        }

        return dict
    }

    /**
     * @param {Object} aRecord - The record object to load from.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Array_store} The current instance after loading the values.
     * @description Loads the array from a record object.
     */
    loadFromRecord (aRecord, aStore) {
        const loadedValues = aRecord.values.map(v => aStore.unrefValue(v))
        if (this.unhooked_push) {
            loadedValues.forEach( v => this.unhooked_push(v) )
        } else {
            loadedValues.forEach( v => this.push(v) )
        }
        return this
    }

    /**
     * @param {Set} [puuids=new Set()] - A Set to store the collected PIDs.
     * @returns {Set} A Set of PIDs (Persistent Unique Identifiers) for JSON storage.
     * @description Collects PIDs for all non-null elements in the array.
     */
    refsPidsForJsonStore (puuids = new Set()) {
        this.forEach(v => { 
            if (!Type.isNull(v)) { 
                v.refsPidsForJsonStore(puuids)
            } 
        })
        return puuids
    }

}).initThisCategory();
