"use strict";

/* 

    HashCache (not to be confused with "Hash Cash")
    
    An key/value db where the keys are hashes of the values.
    There are APIs to help with using as a url load cache.

*/

(class HashCache extends Base {
    initPrototypeSlots () {
        this.newSlot("idb", null)
    }

    init () {
        super.init()
        this.setIdb(IndexedDBFolder.clone())
        this.setIsDebugging(false)
        this.idb().setIsDebugging(false)
        this.setPath("sharedHashCache")
    }

    setPath (aString) {
        this.idb().setPath(aString)
        return this
    }

    promiseHasHash (hash) {
        return this.idb().promiseHasKey(hash)
    }

    async promiseCount () {
        //debugger;
        return this.idb().promiseCount();
    }

    assertValidValue (v) {
        if (typeof(v) !== "undefined") {
            if (typeof(v) === "string") {
                assert(v.length !== 0)
            } else {
                assert(v.byteLength !== 0)
            }
        }
    }

    promiseHasKey (key) {
        console.log("promiseHasKey(" + key + ")");
        return this.idb().promiseHasKey(key)
    }

    async promiseContentForHashOrUrl (hash, url) {
        if (!hash) {
            throw new Error("this API requires a hash");
        }

        const dataFromDb = await this.idb().promiseAt(hash);
        if (typeof(v) !== "undefined") {
            // if we have the value, return it
            this.assertValidValue(dataFromDb);
            return dataFromDb;
        }
        console.log("no hachcache key '" + hash + "' '" + url + "'");
        // otherwise load it from url, store it, and then return it
        return this.promiseLoadUrlAndWriteToHash(url, hash);
    }

    async promiseLoadUrlAndWriteToHash (url, hash) {
        const resource = await UrlResource.with(url).promiseLoad();
        const data = resource.data();
        if (data === undefined) {
            throw new Error("unable to load url: '" + url + "'");
        } else {
            console.log("HashCache loaded url: '" + url + "'");
            debugger;
            await this.promiseAtPut(hash, data);
            return data;
        }
    }

    promiseAt (hash) {
        return this.idb().promiseAt(hash);
    }

    async promiseAtPut (hash, data) {
        this.assertValidValue(data);

        const hasHash = await this.promiseHasHash(hash);

        if (hasHash) {
            // we have this key so no point in writing (as same key always means same value)
            return;
        }

        // verify key before writing
        const dataHash = await this.promiseHashKeyForData(data);

        if (hash !== dataHash) {
            throw new Error("hash key does not match hash of value");
        }

        this.debugLog("HashCache atPut ", hash);
        return this.idb().promiseAtPut(hash, data);
    }

    async promiseHashKeyForData (data) {
        if (typeof(data) === "string") {
            data = new TextEncoder("utf-8").encode(data);    
        }

        const hashArrayBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashString = btoa(String.fromCharCode.apply(null, new Uint8Array(hashArrayBuffer)));
        return hashString;
    }

    promiseClear () {
        debugger
        return this.idb().promiseClear()
    }

    // --- collect invalid records ---

    async removeInvalidRecords () {
        const keys = await this.idb().promiseAllKeys();
        let promise = null;
        keys.forEach(async (key) => {
            await this.promiseVerifyOrDeleteKey(key);
        });
    }

    async promiseVerifyOrDeleteKey (key) {
        const value = this.idb().promiseAt(key);
        const hashKey = this.promiseHashKeyForData(value);
        if (key !== hashKey) {
            await this.idb().promiseRemoveAt(key);
        }
    }

}.initThisClass());
