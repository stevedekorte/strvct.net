"use strict";

/*

    Blob_store 

    Notes:

    It seems there's no way to synchronously serialize a Blob 
    - so we implement a "asyncRecordForStore" method 
    - which the Store will use to make a kvPromise 
    - and add it to it's AtomicMap's queuedSets 
    - which get processed in the promiseCommit before applying the changes to the db.

    Further Notes:

    - using asyncRecordForStore requires the AtomicMap to queue the promises
      waiting on the sets whose values are waiting on these blobs to be serialized.
      Since completion of the writes to the AtomicMap and the write transaction to the db
      has to wait on these promises, we can end up with a situation where writes (and potentially reads) 
      from the next transaction occur before the last is complete.
      
    So, it seems like not writing the blob to the slot until it has already cached a dataUrl for itself 
    might be the simplest option. That would allow us to implement a normal Blob.recordForStore().

*/


(class Blob_store extends Blob {

    static instanceFromRecordInStore (aRecord, aStore) { // should only be called by Store
        //assert(aRecord.type === "Blob")
        const obj = this.fromBase64(aRecord.dataUrl)
        return obj
    }

    loadFromRecord (aRecord, aStore) {
        const dataUrl = aRecord.dataUrl
        return Blob.fromBase64(dataUrl)
    }

    /*
    async asyncRecordForStore (aStore) { // should only be called by Store
        const dataUrl = await this.toBase64()
        return {
            type: "Blob", //Type.typeName(this), // should we use typeName to handle subclasses?
            dataUrl: dataUrl
        }
    }
    */

    async asyncPrepareToStoreSynchronously () {
        this._dataUrl = await this.toBase64()
    }

    recordForStore (aStore) { // should only be called by Store
        assert(this._dataUrl)
        return {
            type: "Blob", //Type.typeName(this), // should we use typeName to handle subclasses?
            dataUrl: this._dataUrl
        }
    }

    refsPidsForJsonStore (puuids = new Set()) {
        return puuids
    }

    // --- serializers ---

    async toBase64 () {
        const promise = Promise.clone();
        const reader = new FileReader();

        reader.onloadend = () => {
            promise.callResolveFunc(reader.result);  // Return the full data URL
        };

        reader.onerror = (error) => {
            promise.callRejectFunc(error);
        };

        reader.readAsDataURL(this);

        return promise;
    }

    // --- deserializer ---
    
    static fromBase64 (dataURL) {
        const parts = dataURL.split(',');
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



