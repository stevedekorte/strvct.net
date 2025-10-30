/**
 * @module library.node.storage.base.categories.primitives
 * @class Blob_store
 * @extends Blob
 * @classdesc
 * A class for handling Blob storage and serialization.
 *
 * Notes:
 * It seems there's no way to synchronously serialize a Blob
 * - so we implement a "asyncRecordForStore" method
 * - which the Store will use to make a kvPromise
 * - and add it to it's AtomicMap's queuedSets
 * - which get processed in the promiseCommit before applying the changes to the db.
 *
 * Further Notes:
 * - using asyncRecordForStore requires the AtomicMap to queue the promises
 *   waiting on the sets whose values are waiting on these blobs to be serialized.
 *   Since completion of the writes to the AtomicMap and the write transaction to the db
 *   has to wait on these promises, we can end up with a situation where writes (and potentially reads)
 *   from the next transaction occur before the last is complete.
 *
 * So, it seems like not writing the blob to the slot until it has already cached a dataUrl for itself
 * might be the simplest option. That would allow us to implement a normal Blob.recordForStore().
 *
 * Further Notes - Immutability:
 *
 * - Since Blobs are immutable, we can can use the same store reference (pid) for all instances with the same content.
 * - So when we construct Blob pids, let's use a hash of the Blob's content as the pid.
 * - PROBLEM: current code expects synchronous pid creation.
 */

"use strict";

(class Blob_store extends Blob {

    /**
     * @static
     * @description Creates an instance from a record in the store.
     * @param {Object} aRecord - The record to create the instance from.
     * @param {Object} aStore - The store containing the record.
     * @returns {Blob_store} A new Blob_store instance.
     * @category Initialization
     */
    static instanceFromRecordInStore (aRecord /*, aStore*/) { // should only be called by Store
        //assert(aRecord.type === "Blob")
        const obj = this.fromBase64(aRecord.dataUrl);
        return obj;
    }

    async asyncPuuid () {
        if (this.hasPuuid()) {
            return this.puuid();
        }

        const puuid = await this.asyncComputePuuid();
        this.setPuuid(puuid);
        return this.puuid();
    }

    async asyncComputePuuid () {
        const arrayBuffer = await this.asyncToArrayBuffer();
        const hexSha256 = await arrayBuffer.asyncHexSha256();
        return hexSha256;
    }

    /**
     * @description Loads the blob from a record.
     * @param {Object} aRecord - The record to load from.
     * @param {Object} aStore - The store containing the record.
     * @returns {Blob} A new Blob instance.
     * @category Data Loading
     */
    loadFromRecord (aRecord /*, aStore*/) {
        const dataUrl = aRecord.dataUrl;
        return Blob.fromBase64(dataUrl);
    }

    /*
    async asyncRecordForStore (aStore) { // should only be called by Store
        const dataUrl = await this.asyncToBase64()
        return {
            type: "Blob", //Type.typeName(this), // should we use typeName to handle subclasses?
            dataUrl: dataUrl
        }
    }
    */

    /**
     * @description Prepares the blob for synchronous storage by caching its base64 representation.
     * @returns {Promise<void>}
     * @category Data Preparation
     */
    async asyncPrepareToStoreSynchronously () {
        this._dataUrl = await this.asyncToBase64();
    }

    /**
     * @description Creates a record for storage.
     * @param {Object} aStore - The store to create the record for.
     * @returns {Object} The record object.
     * @category Data Serialization
     */
    recordForStore (/*aStore*/) { // should only be called by Store
        assert(this._dataUrl);
        return {
            type: "Blob", //Type.typeName(this), // should we use typeName to handle subclasses?
            dataUrl: this._dataUrl
        };
    }

    /**
     * @description Gets the referenced persistent IDs for JSON store.
     * @param {Set} puuids - Set of persistent UUIDs.
     * @returns {Set} The set of referenced persistent IDs.
     * @category Data Reference
     */
    refsPidsForJsonStore (puuids = new Set()) {
        return puuids;
    }

    /**
     * @description Converts the blob to a base64 string.
     * @returns {Promise<string>} A promise that resolves to the base64 representation of the blob.
     * @category Data Conversion
     */
    async asyncToBase64 () {
        return this.asyncToDataUrl();
    }

    /**
     * @static
     * @description Creates a Blob from a base64 string.
     * @param {string} dataURL - The base64 data URL.
     * @returns {Blob} A new Blob instance.
     * @category Data Conversion
     */
    static fromBase64 (dataURL) {
        const parts = dataURL.split(",");
        const mimeType = parts[0].slice(5, -7);
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

}).initThisCategory();
