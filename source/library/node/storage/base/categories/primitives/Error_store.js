"use strict";

/**
 * @module library.node.storage.base.categories.primitives
 * @class Error_store
 * @extends Error
 * @classdesc A class representing an error that can be stored and loaded from a record.
 */
(class Error_store extends Error {

    /**
     * @description Loads the error information from a record.
     * @param {Object} aRecord - The record containing error information.
     * @param {Object} aStore - The store object.
     * @returns {Error_store} The current instance.
     * @category Data Loading
     */
    loadFromRecord(aRecord, aStore) {
        this.name = aRecord.name;
        this.message = aRecord.message;
        return this
    }

    /**
     * @description Creates a record for storing the error information.
     * @param {Object} aStore - The store object.
     * @returns {Object} An object containing the error information.
     * @category Data Storage
     */
    recordForStore(aStore) { // should only be called by Store
        return {
            type: this.type(), 
            name: this.name,
            message: this.message
        }
    }

    /**
     * @description Determines if the error should be stored.
     * @returns {boolean} Always returns true.
     * @category Data Storage
     */
    shouldStore() {
        return true
    }

    /**
     * @description Gets the reference PIDs for JSON store.
     * @param {Set} puuids - A set of PIDs.
     * @returns {Set} The input set of PIDs.
     * @category Data Reference
     */
    refsPidsForJsonStore(puuids = new Set()) {
        return puuids
    }

}).initThisCategory();