"use strict";

/* 

    IndexedDBFolder

*/

(class IndexedDBFolder extends ProtoClass {
    initPrototypeSlots () {
        this.newSlot("path", "/")
        this.newSlot("pathSeparator", "/") // path should end with pathSeparator
        this.newSlot("db", null)
        this.newSlot("didRequestPersistence", false)
        this.newSlot("isGranted", false)

        this.newSlot("isOpening", false)
        this.newSlot("onOpenPromises", null)
    }

    init () {
        super.init()
        this.setOnOpenPromises([])
        //this.requestPersistenceIfNeeded()
        this.setIsDebugging(false)
    }

    hasIndexedDB () {
        return "indexedDB" in window;
    }

    requestPersistenceIfNeeded () {
        if (!IndexedDBFolder.didRequestPersistence()) {
            this.requestPersistence()
        }
        return this
    }

    requestPersistence () {
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((granted) => {
                this.setIsGranted(granted)
                if (granted) {
                    alert("Storage will not be cleared except by explicit user action");
                } else {
                    alert("Storage may be cleared by the UA under storage pressure.");
                }
            })
        }

        IndexedDBFolder.setDidRequestPersistence(true)

        return this
    }

    storeName () {
        return this.path()
    }

    root () {
        if (!IndexedDBFolder._root) {
            IndexedDBFolder._root = IndexedDBFolder.clone()
            // IndexedDBFolder._root.rootShow()
        }
        return IndexedDBFolder._root
    }

    isOpen () {
        return (this.db() !== null)
    }

    asyncOpenIfNeeded (resolve, reject) {
        if (this.isOpen()) {
            resolve()
        } else {
            if (!this.isOpening()) {
                this.asyncOpen(() => this.onResolveOpen(), (error) => this.onRejectOpen(error))
            }
            this.onOpenPromises().push([resolve, reject])
        }
    }

    onResolveOpen () {
        this.onOpenPromises().forEach(entry => entry[0]())
        this.onOpenPromises().clear()
    }

    onRejectReject (error) {
        this.onOpenPromises().forEach(entry => entry[1](error))
        this.onOpenPromises().clear()
    }

    /*
    asyncOpenIfNeeded (resolve, reject) {
        if (!this.isOpen()) {
            this.asyncOpen(resolve, reject)
        } else {
            resolve()
        }
    }
    */

    asyncOpen (resolve, reject) {
        assert(!this.isOpen())

        this.setIsOpening(true)
        
        if (!this.hasIndexedDB()) {
            reject("IndexedDB unavailable on this client.")
            return
        }

        this.debugLog(() => { "asyncOpen '" + this.path() + "'" })

        const request = window.indexedDB.open(this.path(), 2);

        request.onsuccess = (event) => {
            this.onOpenSuccess(event, resolve, reject)
        }

        request.onupgradeneeded = (event) => {
            this.onOpenUpgradeNeeded(event, resolve, reject)
        }

        request.onerror = (event) => {
            this.onOpenError(event, resolve, reject)
        }

        return this
    }

    onOpenError (event, resolve, reject) {
        let message = event.message
        if (!message) {
            message = "Unable to open IndexedDB.<br>May not work on Brave Browser."
            this.debugLog(" open db error: ", event);
        }

        if (reject) {
            reject(message)
        }
    }

    onOpenUpgradeNeeded (event, resolve, reject) {
        this.debugLog(" onupgradeneeded - likely setting up local database for the first time")

        const db = event.target.result;

        db.onerror = function (event) {
            console.log("db error ", event)
        };

        this.setDb(db)

        const objectStore = db.createObjectStore(this.storeName(), { keyPath: "key" }, false);
        objectStore.createIndex("key", "key", { unique: true });
    }

    onOpenSuccess (event, resolve, reject) {
        this.setDb(event.target.result)
        if (resolve) {
            resolve()
        }
    }

    close () {
        if (this.isOpen()) {
            this.db().close()
            this.setIsOpen(false)
            this.setDb(null)
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

    asyncHasKey (key, resolve, reject) {
        const objectStore = this.db().transaction(this.storeName(), "readonly").objectStore(this.storeName())
        //const keyRangeValue = IDBKeyRange.bound(key, key)
        //const request = objectStore.openCursor(keyRangeValue)
        const request = objectStore.openCursor(key)

        request.onsuccess = function(e) {
          const cursor = e.target.result
          if (cursor) { // key already exist
            resolve(true)
          } else { // key not exist
            resolve(false)
          }
        }

        request.onerror = (event) => {
            console.log("asyncAt('" + key + "') onerror", event.target.error)
            reject(event)
        }
    }
    
    asyncAt (key, callback) {
        //console.log("asyncAt ", key)
        const objectStore = this.db().transaction(this.storeName(), "readonly").objectStore(this.storeName())
        const request = objectStore.get(key);

        const stack = "(stack recording disabled)" //new Error().stack
        
        request.onerror = (event) => {
            console.log("asyncAt('" + key + "') onerror", event.target.error)
            callback(undefined)
        }
        
        request.onsuccess = (event) => {
            // request.result is undefined if value not in DB
            try {
                if (!Type.isUndefined(request.result)) {
                    const entry = request.result
                    //const value = JSON.parse(entry.value)
                    const value = entry.value
                    callback(value)
                } else {
                    callback(undefined)
                }
            } catch (e) {
                this.debugLog(" asyncAt('" +  key + "') caught stack ", stack)
            }
        }
        
        return this
    }
    
    readOnlyCursorRequest () {
        const cursorRequest = this.db().transaction(this.storeName(), "readonly").objectStore(this.storeName()).openCursor()
        cursorRequest.onerror = (event) => {
            this.debugLog("cursorRequest.onerror ", event)
            throw newError("error requesting cursor")
        }
        return cursorRequest
    }

    asyncAllKeys (callback) {
        const keys = []
        const cursorRequest = this.readOnlyCursorRequest()

        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result
            if (cursor) {
                keys.push(cursor.value.key)
                cursor.continue()
            } else {
                callback(keys)
            }
        }
    }

    asyncForeachKey (callback) {
        const cursorRequest = this.readOnlyCursorRequest()

        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result
            if (cursor) {
                const key = cursor.value.key
                callback(key)
                cursor.continue()
            }
        }
    }


    asyncAsMap (callback) {
        const cursorRequest = this.readOnlyCursorRequest()
        const map = new Map()

        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;

            if (cursor) {
                const k = cursor.value.key
                const v = cursor.value.value
                //debugger;
                //map.set(k, JSON.parse(v))
                map.set(k, v)
                cursor.continue();
            } else {
                this.debugLog(" asyncAsMap returning map ", map.description())
                callback(map)
            }
        }
    }

    show () {
        this.asyncAsMap((map) => {
            this.debugLog(" " + this.path() + " = " + map.description())
        })
    }

    // removing

    asyncClear (callback, reject) {
        const transaction = this.db().transaction([this.storeName()], "readwrite");

        transaction.onerror = function (event) {
            if (reject) {
                console.log("db clear error")
                reject(event)
            }
        };

        transaction.oncomplete = function (event) {
            console.log("db clear completed")
        }

        const objectStore = transaction.objectStore(this.storeName());
        const request = objectStore.clear();

        request.onsuccess = function (event) {
            if (callback) {
                console.log("db clear request success")
                callback(event)
            }
        };
    }

    asyncDelete () {
        const request = window.indexedDB.deleteDatabase(this.storeName())

        request.onerror = (event) => {
            this.debugLog("Error deleting '" + this.storeName() + "'");
        }

        request.onsuccess = (event) => {
            this.debugLog(" deleted successfully '" + this.storeName() + "'");
        }

        this.setDb(null)
        return this
    }

    // test

    test () {
        const folder = IndexedDBFolder.clone()
        folder.asyncOpen(() => {
            folder.atPut("test", "x")

            folder.asyncAsMap(function (map) {
                console.log("db map = ", map)
            })

            folder.asyncAt("test", function (value) {
                console.log("read ", value)
            })
        })

    }

    newTx () {
        return IndexedDBTx.clone().setDbFolder(this)
    }
}.initThisClass());
