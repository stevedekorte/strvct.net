"use strict";

/**
 * Extends the ArrayBuffer class with storage-related functionality.
 * @module library.node.storage.base.categories.primitives
 * @class ArrayBuffer_store
 * @extends ArrayBuffer
 * @classdesc Provides methods for storing and loading ArrayBuffer data in a store.
 */
(class ArrayBuffer_store extends ArrayBuffer {

    /**
     * Creates an instance of ArrayBuffer_store from a record in the store.
     * @static
     * @param {Object} aRecord - The record containing the ArrayBuffer data.
     * @param {Object} aStore - The store object.
     * @returns {ArrayBuffer_store} A new instance of ArrayBuffer_store.
     * @description Should only be called by Store.
     */
    static instanceFromRecordInStore (aRecord, aStore) {
        //assert(aRecord.type === "ArrayBuffer")
        const bytes = aRecord.bytes
        const obj = new ArrayBuffer(bytes.length)
        return obj
    }

    /**
     * Loads data from a record into this ArrayBuffer_store instance.
     * @param {Object} aRecord - The record containing the ArrayBuffer data.
     * @param {Object} aStore - The store object.
     * @returns {ArrayBuffer_store} This instance after loading the data.
     */
    loadFromRecord (aRecord, aStore) {
        assert(aRecord.bytes.length === this.length)
        const bytes = aRecord.bytes
        for (let i = 0; i < bytes.length; i++) {
            this[i] = bytes[i]
        }
        return this
    }

    /**
     * Converts the ArrayBuffer_store to an array of bytes.
     * @returns {number[]} An array of byte values.
     */
    bytes () {
        const bytes = []
        for (let i = 0; i < this.byteLength; i++) {
            bytes.push(this[i])
        }
        return bytes
    }

    /**
     * Creates a record representation of this ArrayBuffer_store for storage.
     * @param {Object} aStore - The store object.
     * @returns {Object} A record object representing this ArrayBuffer_store.
     * @description Should only be called by Store.
     */
    recordForStore (aStore) {
        return {
            type: "ArrayBuffer", //Type.typeName(this), 
            bytes: this.bytes(),
        }
    }

    /**
     * Returns a Set of persistent unique identifiers (PUIDs) for this ArrayBuffer_store.
     * @param {Set<string>} [puuids=new Set()] - A Set to store the PUIDs.
     * @returns {Set<string>} The Set of PUIDs.
     */
    refsPidsForJsonStore (puuids = new Set()) {
        return puuids
    }
    
}).initThisCategory();