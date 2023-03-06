"use strict";

/* 

    IndexedDBFolder

*/

(class IndexedDBFolder extends ProtoClass {
    initPrototypeSlots () {
        this.newSlot("path", "/")
        this.newSlot("pathSeparator", "/") // path should end with pathSeparator
        this.newSlot("db", null)

        // requesting persistence
        this.newSlot("hasPermission", false)
        this.newSlot("promiseForPersistence", null)

        this.newSlot("promiseForOpen", null) // has a value while opening. Returns this value while opening so multiple requests queue for open
        this.newSlot("promiseForCommit", null) 
    }

    init () {
        super.init()
        this.setIsDebugging(false)
    }

    setPath (aString) {
        assert(!this.isOpen())
        this._path = aString
        return this
    }

    hasIndexedDB () {
        return "indexedDB" in window;
    }

    /*
    promiseHasIndexedDB () {
        if (this.hasIndexedDB()) {
            return Promise.resolve()
        } 
        return Promise.reject(new Error("IndexedDB unavailable on this client."))
    }
    */

    hasStorageApi () {
        return navigator.storage && navigator.storage.persist
    }

    promisePersistence () {
        if (!this.promiseForPersistence()) {
            this.setPromiseForPersistence(this.newPromisePersistence())
        }
        return this.promiseForPersistence()
    }

    newPromisePersistence () {
        if (!this.hasStorageApi()) {
            return Promise.reject(new Error("Missing navigator.storage API."))
        }

        return navigator.storage.persist().then((granted) => {
            this.setHasPermission(granted)
            if (granted) {
                console.log("Storage will not be cleared except by explicit user action.");
                resolve(true)
            } else {
                console.warn("Storage may be cleared by the UA under storage pressure.");
                reject(false)
            }
        })
    }

    storeName () {
        return this.path()
    }

    /*
    root () {
        if (!IndexedDBFolder._root) {
            IndexedDBFolder._root = IndexedDBFolder.clone()
            // IndexedDBFolder._root.rootShow()
        }
        return IndexedDBFolder._root
    }
    */

    isOpen () {
        return (this.db() !== null)
    }

    promiseOpen () {
        if (!this.promiseForOpen()) {
            this.setPromiseForOpen(this.newPromiseOpen())
        }
        return this.promiseForOpen()
    }

    newPromiseOpen () {
        assert(this.hasIndexedDB())

        return new Promise((resolve, reject) => {
            if(this.isOpen()) {
                resolve()
                return
            }

            const version = 2 // can't be zero
            //console.log(this.typeId() + " promiseOpen '" + this.path() + "'")
            const request = window.indexedDB.open(this.path(), version);

            request.onsuccess = (event) => {
                //debugger;
                this.setDb(event.target.result)
                resolve()
            }

            request.onupgradeneeded = (event) => {
                //debugger;
                resolve(this.promiseOnOpenUpgradeNeeded(event))
            }

            request.onerror = (error) => {
                debugger;
                this.debugLog(" open db error: ", event);
                this.onOpenError(event)
                reject(error)
            }
        })
    }

    onOpenError (event) {
        let message = event.message
        if (!message) {
            message = "Unable to open IndexedDB.<br>May not work on Brave Browser."
            this.debugLog(" open db error: ", event);
        }
    }

    promiseOnOpenUpgradeNeeded (event) {
        return new Promise((resolve, reject) => {
            this.debugLog(" onupgradeneeded - likely setting up local database for the first time")

            const db = event.target.result;

            db.onerror = (event) => {
                console.log("db error ", event)
            };

            this.setDb(db)

            const objectStore = db.createObjectStore(this.storeName(), { keyPath: "key" }, false);
            const idbIndex = objectStore.createIndex("key", "key", { unique: true });
            resolve()
        })
    }

    close () {
        if (this.isOpen()) {
            this.db().close()
            this.setIsOpen(false)
            this.setDb(null)
            this.setPromiseForOpen(null)
        }
        return this
    }

    // paths

    folderAt (pathComponent) {
        assert(!pathComponent.contains(this.pathSeparator()))
        const db = IndexedDBFolder.clone().setPath(this.path() + pathComponent + this.pathSeparator())
        return db
    }

    pathForKey (key) {
        //assert(!key.contains(this.pathSeparator()))
        return this.path() + key
    }

    // reading

    promiseHasKey (key) {
        return new Promise((resolve, reject) => {
            const objectStore = this.db().transaction(this.storeName(), "readonly").objectStore(this.storeName())
            //const keyRangeValue = IDBKeyRange.bound(key, key)
            //const request = objectStore.openCursor(keyRangeValue)
            const request = objectStore.openCursor(key)

            request.onsuccess = (evente) => {
                const cursor = event.target.result
                if (cursor) { // key already exists
                    resolve(true)
                } else { // key does not exist
                    resolve(false)
                }
            }

            request.onerror = (event) => {
                console.log("promiseAt('" + key + "') onerror", event.target.error)
                reject(event)
            }
        })
    }
    
    promiseAt (key) {
        return new Promise((resolve, reject) => {
            //console.log("promiseAt ", key)
            const objectStore = this.db().transaction(this.storeName(), "readonly").objectStore(this.storeName())
            const request = objectStore.get(key);
            const stack = "(stack recording disabled)" //new Error().stack

            request.onsuccess = (event) => {
                // request.result is undefined if value not in DB
                try {
                    if (!Type.isUndefined(request.result)) {
                        const entry = request.result
                        const value = entry.value
                        resolve(value)
                    } else {
                        resolve(undefined)
                    }
                } catch (e) {
                    this.debugLog(" promiseAt('" +  key + "') caught stack ", stack)
                }
            }
            
            request.onerror = (event) => {
                console.log("promiseAt('" + key + "') onerror", event.target.error)
                resolve(undefined)
            }
            
        })
    }

    /*

    promiseReadOnlyCursorRequest () {
        return new Promise((resolve, reject) => {
            const objectStore = this.db().transaction(this.storeName(), "readonly").objectStore(this.storeName())
            const idbRequest = objectStore.openCursor()
            idbRequest.onsuccess = (event) => {
                resolve(event)
            }
            idbRequest.onerror = (event) => {
                reject(event)
            }
        })
    }


    promiseForeachKey (aBlock) {
        return this.promiseReadOnlyCursorRequest().then((event) => {
            const cursor = event.target.result
            if (cursor) {
                aBlock(cursor.value.key)
                cursor.continue() // this calls open resolve function again
            } else {
                resolve()
            }
        })
    }
    */


    promiseAsMap () {
        return new Promise((resolve, reject) => {
            const objectStore = this.db().transaction(this.storeName(), "readonly").objectStore(this.storeName())
            const idbRequest = objectStore.getAll()

            idbRequest.onsuccess = (event) => {
                const results = event.target.result
                const map = new Map()
                results.forEach(result => {
                    map.set(result.key, result.value)
                })
                resolve(map)
            }

            idbRequest.onerror = (event) => {
                reject(event)
            }
        })
    }

    show () {
        this.promiseAsMap().then((map) => {
            this.debugLog(" " + this.path() + " = " + map.description())
        })
    }

    // removing

    promiseClear () {
        return new Promise((resolve, reject) => {

            // setup transaction 
            const transaction = this.db().transaction([this.storeName()], "readwrite");

            transaction.onerror = (event) => {
                console.log("db clear tx error")
                reject(event)
            };

            transaction.oncomplete = (event) => {
                console.log("db clear tx completed")
                resolve(event)
            }

            // setup clear request
            const objectStore = transaction.objectStore(this.storeName());
            const request = objectStore.clear();

            request.onsuccess = (event) => {
                console.log("db clear request success")
                //resolve(event) // we use tx oncomplete (see above code in this method) instead
            };

            request.onerror = (event) => {
                console.log("db clear error")
                reject(event)
            };

        })
    }

    promiseDelete () {
        assert(!this.isOpen())

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(this.storeName())

            request.onerror = (error) => {
                this.debugLog("Error deleting '" + this.storeName() + "'");
                reject(error)
            }

            request.onsuccess = (event) => {
                this.debugLog(" deleted successfully '" + this.storeName() + "'");
                resolve(event)
            }

            this.setDb(null)
        })
    }

    newTx () {
        return IndexedDBTx.clone().setDbFolder(this)
    }

    debugTypeId () {
        return super.debugTypeId() + " '" + this.path() + "'"
    }

    // test

    static selfTest () {
        const folder = IndexedDBFolder.clone()
        folder.promiseOpen().then(() => {
            return folder.promiseAtPut("test", "x")
        }).then(() => {
            folder.promiseAsMap().then((map) => { console.log("db map = ", map) })
        }).then(() => {
            folder.promiseAt("test", (v) => { console.log("read ", v) })
        })
    }

}.initThisClass());
