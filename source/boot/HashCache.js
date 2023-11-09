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

    promiseCount () {
        return this.idb().promiseCount()
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
        return this.idb().promiseHasKey(key)
    }

    promiseContentForHashOrUrl (hash, url) {
        //debugger
        if (hash) {
            return this.idb().promiseAt(hash).then((dataFromDb) => {
                if (typeof(v) !== "undefined") {
                    // if we have the value, return it
                    this.assertValidValue(dataFromDb)
                    return Promise.resolve(dataFromDb)
                }
                //debugger
                console.log("no hachcache key '" + hash + "' '" + url + "'")
                // otherwise load it from url, store it, and then return it
                return this.promiseLoadUrlAndWriteToHash(url, hash)
            })
        } else {
            // if you want to create a key, use the promiseHashKeyForData() API
            // TODO add a data write API so we don't compute hash twice
            return Promise.reject(new Error("this API requires a hash"))
            //  load it from url, store it, and then return it
            //return this.promiseLoadUrlAndWriteToHash(url, hash)
        }
    }

    promiseLoadUrlAndWriteToHash (url, hash) {
        return UrlResource.with(url).promiseLoad().then((resource) => {
            const data = resource.data()
            debugger
            if (data === undefined) {
                throw new Error("unable to load url: '" + url + "'")
            } else {
                console.log("HashCache loaded url: '" + url + "'")
                debugger
                return this.promiseAtPut(hash, data).then(() => {
                    return Promise.resolve(data)
                })
            }
        })
    }

    promiseAt (hash) {
        return this.idb().promiseAt(hash)
    }

    promiseAtPut (hash, data) {
        this.assertValidValue(data)

        return this.promiseHasHash(hash).then((hasHash) => {
            if (hasHash) {
                // we have this key so no point in writing (as same key always means same value)
                return Promise.resolve()
            }

            // verify key before writing
            return this.promiseHashKeyForData(data).then((dataHash) => {
                if (hash === dataHash) {
                    console.log("HashCache atPut ", hash)
                    return this.idb().promiseAtPut(hash, data)
                }
                return Promise.reject(new Error("hash key does not match hash of value"))
            })
        })
    }

    promiseHashKeyForData (data) {
        if (typeof(data) === "string") {
            data = new TextEncoder("utf-8").encode(data);    
        }

        return crypto.subtle.digest("SHA-256", data).then((hashArrayBuffer) => {
            const hashString = btoa(String.fromCharCode.apply(null, new Uint8Array(hashArrayBuffer)))
            return Promise.resolve(hashString)
        })
    }

    promiseClear () {
        debugger
        return this.idb().promiseClear()
    }

    // --- collect invalid records ---

    removeInvalidRecords () {
        this.idb().promiseAllKeys().then((keys) => {
            let promise = null
            keys.forEach((key) => {
                if (!promise) {
                    promise = this.promiseVerifyOrDeleteKey(key)
                } else {
                    promise = promise.then(() => this.promiseVerifyOrDeleteKey(key))
                }
            })
        })
    }

    promiseVerifyOrDeleteKey (key) {
        return this.idb().promiseAt(key).then((value) => {
            return this.promiseHashKeyForData(value).then((hashKey) => {
                if (key !== hashKey) {
                    return this.idb().promiseRemoveAt(key)
                } else {
                    return Promise.resolve()
                }
            })
        })
    }

}.initThisClass());
