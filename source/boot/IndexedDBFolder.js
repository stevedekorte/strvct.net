"use strict";

/* 

    IndexedDBFolder

*/

(class IndexedDBFolder extends Base {
    initPrototypeSlots () {
        this.newSlot("path", "/")
        this.newSlot("pathSeparator", "/") // path should end with pathSeparator
        this.newSlot("db", null)

        // requesting persistence
        this.newSlot("hasPermission", false)
        this.newSlot("promiseForPersistence", null)

        this.newSlot("promiseForOpen", null) // has a value while opening. Returns this value while opening so multiple requests queue for open
        this.newSlot("lastTx", null) 
        //this.newSlot("keyCacheSet", null) 
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
                //console.log("IndexedDBFolder: Storage will not be cleared except by explicit user action.");
            } else {
                console.warn("WARNING: IndexedDBFolder: Storage may be cleared by the UA under storage pressure.");
            }
        })
    }

    storeName () {
        return this.path()
    }

    isOpen () {
        return (this.db() !== null)
    }

    promiseOpen () {
        if (!this.promiseForOpen()) {
            this.setPromiseForOpen(this.promisePersistence().then(() => this.newPromiseOpen()))
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
                this.onOpenUpgradeNeeded(event) // onsuccess will be called next?
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

    onOpenUpgradeNeeded (event) {
        this.debugLog(" onupgradeneeded - likely setting up local database for the first time")

        const db = event.target.result;

        db.onerror = (event) => {
            console.log("db error ", event)
        };

        this.setDb(db)

        const objectStore = db.createObjectStore(this.storeName(), { keyPath: "key" }, false);
        const idbIndex = objectStore.createIndex("key", "key", { unique: true });
    }

    close () {
        if (this.isOpen()) {
            this.db().close()
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

    // private helpers

    readOnlyObjectStore () { // private
        const tx = this.db().transaction([this.storeName()], "readonly");

        tx.onerror = (event) => {
            const m = "readOnlyObjectStore tx error"
            console.error(m)
            throw new Error(m)
        };

    
        tx.oncomplete = (event) => {
            //console.log("readOnlyObjectStore tx completed")
            //debugger
        }
        

        const objectStore = tx.objectStore(this.storeName())
        return objectStore
    }

    readWriteObjectStore () { // private
        debugger
        const tx = this.db().transaction([this.storeName()], "readwrite");
        
        tx.onerror = (event) => {
            const m = "readWriteObjectStore tx error"
            console.error(m)
            throw new Error(m)
        };

        
        tx.oncomplete = (event) => {
            console.log("readWriteObjectStore tx oncomplete ", tx._note)
            debugger
        }
        

        const objectStore = tx.objectStore(this.storeName())
        objectStore._tx = tx
        return objectStore
    }

    // reading

    promiseHasKey (key) {
        return this.promiseOpen().then(() => {
            return this.promiseCount(key).then((count) => {
                const hasKey = count !== 0;
                //debugger;
                return Promise.resolve(hasKey)
            })
        })
    }

    currentStack () {
        const stack = this.isDebugging() ? new Error().stack : "(call IndexedDBFolder.setIsDebugging(true) to get a stack recording)" 
        return stack
    }
    
    promiseAt (key) {
        return this.promiseOpen().then(() => {
            return new Promise((resolve, reject) => {
                //console.log("promiseAt ", key)
                const objectStore = this.readOnlyObjectStore()
                const request = objectStore.get(key);
                const stack = this.currentStack()

                request.onsuccess = (event) => {
                    // request.result is undefined if value not in DB
                    try {
                        if (typeof(request.result) !== "undefined") {
                            const entry = request.result
                            const value = entry.value
                            resolve(value)
                        } else {
                            resolve(undefined)
                        }
                    } catch (e) {
                        this.debugLog(" promiseAt('" +  key + "') caught stack ", stack)
                        throw e
                    }
                }
                
                request.onerror = (event) => {
                    console.log("promiseAt('" + key + "') onerror", event.target.error)
                    resolve(undefined)
                }
            })
        })
    }

    promiseCount (optionalKey) {
        return this.promiseOpen().then(() => {
            return new Promise((resolve, reject) => {
                const objectStore = this.readOnlyObjectStore()
                const request = objectStore.count(optionalKey);
                const stack = this.currentStack()

                request.onsuccess = (event) => {
                    const count = request.result
                    if (optionalKey) {
                        //console.log("promiseCount " + count + " for optionalKey: '" + optionalKey + "'")
                        //debugger;
                    }
                    resolve(count)
                }
                
                request.onerror = (event) => {
                    console.error("promiseCount() onerror: ", event.target.error, " stack: ", stack)
                    reject(event)
                }
            })
        })
    }

    promiseAllKeys () {
        return this.promiseOpen().then(() => {
            return new Promise((resolve, reject) => {
                const objectStore = this.readOnlyObjectStore()
                const request = objectStore.getAllKeys();
                const stack = this.currentStack()

                request.onsuccess = (event) => {
                    const keysArray = request.result
                    //console.log("promiseAllKeys ", keysArray)
                    resolve(keysArray)
                }
                
                request.onerror = (event) => {
                    console.error("promiseCount() onerror: ", event.target.error, " stack: ", stack)
                    reject(event)
                }
            })
        })
    }

    /*

    promiseReadOnlyCursorRequest () {
        return new Promise((resolve, reject) => {
            const objectStore = this.readOnlyObjectStore()
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
        return this.promiseOpen().then(() => {
            return new Promise((resolve, reject) => {
                const objectStore = this.readOnlyObjectStore()
                const request = objectStore.getAll()
                const stack = this.currentStack()

                request.onsuccess = (event) => {
                    const results = event.target.result
                    const map = new Map()
                    results.forEach(result => {
                        map.set(result.key, result.value)
                    })
                    resolve(map)
                }

                request.onerror = (event) => {
                    reject(event)
                }
            })
        })
    }

    show () {
        this.promiseAsMap().then((map) => {
            this.debugLog(" " + this.path() + " = " + map.description())
        })
    }

    // removing

    promiseClear () {
        //debugger;
        return this.promiseOpen().then(() => {
            return new Promise((resolve, reject) => {
                const objectStore = this.readWriteObjectStore();
                objectStore._tx._note = "promiseClear"
                
                const request = objectStore.clear();
                const stack = this.currentStack()

                objectStore._tx.oncomplete = (event) => {
                    console.log("db promiseClear tx oncomplete")
                    resolve(event) 
                };

                request.onsuccess = (event) => {
                    console.log("db promiseClear request onsuccess")
                    //debugger;
                    //resolve(event) // use tx oncomplete instead?
                };

                request.onerror = (event) => {
                    console.log("db promiseClear request error")
                    reject(event)
                };
            })
        })
    }

    promiseDelete () {
        debugger
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

    assertLastTxCommitedOrAborted () {
        const tx = this.lastTx()
        assert(tx)
        const isOk = tx.isAborted() || tx.isCommitted();
        if (!isOk) {
            tx.show()
        }
        assert(isOk)
    }

    promiseNewTx () {
        assert(this.isOpen())
        //debugger;
        console.log(this.path() + " promiseNewTx")
        /*
        const lastTx = this.lastTx()
        if (lastTx) {
            // technically, it's ok to have multiple unfinished txs, 
            // but AFAIK I don't use them at the moment, 
            // so this is a sanity check for now 

            if (!lastTx.isFinished()) {
                if (!lastTx.isCommitted()) {
                    console.warn("WARNING: last tx was not committed yet!")
                    console.log("last tx:")
                    lastTx.show()
                } 

                return lastTx.promiseForFinished().then(() => {
                    return Promise.resolve(this.privateNewTx())
                })
            }
        }
        */
        return Promise.resolve(this.privateNewTx())
    }

    privateNewTx () {
        //debugger;
        //SyncScheduler.shared().scheduleTargetAndMethod(this, "assertLastTxCommitedOrAborted")
        if (this.lastTx()) {
            //assert(this.lastTx().isCommitted() || this.lastTx().isAborted())
        }
        const newTx = IndexedDBTx.clone().setDbFolder(this)
        this.setLastTx(newTx)
        return newTx
    }


    debugTypeId () {
        return super.debugTypeId() + " '" + this.path() + "'"
    }

    // -------------------------------------------------------------------

    promiseAtPut (key, value) {
        return this.promiseOpen().then(() => {
            if (typeof(value) === "undefined") {
                return this.promiseRemoveAt(key)
            }

            console.log("idb promiseHasKey ", key)
            return this.promiseHasKey(key).then((hasKey) => {
                if (hasKey) {
                    console.log("idb YES hasKey promiseUpdate", key)

                    return this.promiseUpdate(key, value)
                } else {
                    console.log("idb NO hasKey promiseAdd", key)
                    return this.promiseAdd(key, value)
                }
            })
        })//.then(() => this.promiseAssertHasKey(key))
    }

    promiseAssertHasKey (key) {
        return this.promiseHasKey(key).then((hasKey) => {
            if (!hasKey) {
                debugger;
                return Promise.reject(new Error("failed assert"))
            } else {
                return Promise.resolve()
            }
        })
    }

    promiseUpdate (key, value) { // private
        return this.promiseNewTx().then((tx) => {
            tx.begin()
            tx.setIsDebugging(this.isDebugging())
            tx.atUpdate(key, value)
            return tx.promiseCommit() 
        })
    }

    promiseAdd (key, value) { // private
        return this.promiseNewTx().then((tx) => {
            console.log("idb tx atAdd ", key)
            tx.begin()
            //tx.setIsDebugging(this.isDebugging())
            //tx.setIsDebugging(true)
            tx.atAdd(key, value)
            return tx.promiseCommit() 
        })
    }

    promiseRemoveAt (key) {
        return this.promiseOpen().then(() => {
            return this.promiseNewTx().then((tx) => {
                tx.begin()
                tx.setIsDebugging(this.isDebugging())
                tx.removeAt(key)
                return tx.promiseCommit() 
            })
        })
    }

    // test

    static promiseSelfTest () {
        const folder = IndexedDBFolder.clone()
        folder.promiseAtPut("test", "x").then(() => {
            folder.promiseAsMap().then((map) => { console.log("db map = ", map) })
        }).then(() => {
            folder.promiseAt("test", (v) => { console.log("read ", v) })
        })
    }

}.initThisClass());
