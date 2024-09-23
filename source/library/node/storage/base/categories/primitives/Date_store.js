/**
 * @module library.node.storage.base.categories.primitives
 * @class Date_store
 * @extends Date
 * @classdesc A class that extends the native Date object with additional methods for storage functionality.
 */
"use strict";

(class Date_store extends Date {

    /**
     * Loads the date from a record.
     * @param {Object} aRecord - The record containing the date information.
     * @param {Object} aStore - The store object.
     * @returns {Date_store} The current instance.
     */
    loadFromRecord(aRecord, aStore) {
        this.setTime(aRecord.time)
        return this
    }

    /**
     * Creates a record for storage.
     * @param {Object} aStore - The store object.
     * @returns {Object} An object containing the type and time of the date.
     */
    recordForStore(aStore) { // should only be called by Store
        return {
            type: this.type(), 
            time: this.getTime() // toJSON is a standard library Date method
        }
    }

    /**
     * Determines if the date should be stored.
     * @returns {boolean} Always returns true.
     */
    shouldStore() {
        return true
    }

    /**
     * Returns the set of persistent unique identifiers for JSON storage.
     * @param {Set} puuids - A set of persistent unique identifiers.
     * @returns {Set} The input set of persistent unique identifiers.
     */
    refsPidsForJsonStore(puuids = new Set()) {
        return puuids
    }

}).initThisCategory();