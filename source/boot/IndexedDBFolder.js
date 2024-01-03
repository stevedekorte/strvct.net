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

    hasStorageApi () {
        return navigator.storage && navigator.storage.persist
    }

    promisePersistence () {
        if (!this.promiseForPersistence()) {
            this.setPromiseForPersistence(this.newPromisePersistence())
        }
        return this.promiseForPersistence()
    }

    async newPromisePersistence () {
        if (!this.hasStorageApi()) {
            return Promise.reject(new Error("Missing navigator.storage API."))
        }

        const granted = await navigator.storage.persist();
        
        this.setHasPermission(granted);
        if (granted) {
            //console.log("IndexedDBFolder: Storage will not be cleared except by explicit user action.");
        } else {
            console.warn("WARNING: IndexedDBFolder: Storage may be cleared by the UA under storage pressure.");
        }

        return granted;
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
        assert(this.hasIndexedDB());
        const openPromise = Promise.clone();

        if(this.isOpen()) {
            return Promise.resolve();
        }

        const version = 2 // can't be zero
        //console.log(this.typeId() + " promiseOpen '" + this.path() + "'")
        const request = window.indexedDB.open(this.path(), version);

        request.onsuccess = (event) => {
            //debugger;
            this.setDb(event.target.result)
            openPromise.callResolveFunc();
        }

        request.onupgradeneeded = (event) => {
            //debugger;
            this.onOpenUpgradeNeeded(event) // onsuccess will be called next?
        }

        request.onerror = (error) => {
            debugger;
            this.debugLog(" open db error: ", event);
            this.onOpenError(event)
            openPromise.callRejectFunc(error);
        }

        return openPromise;
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

    async promiseHasKey (key) {
        await this.promiseOpen();
        const promise = Promise.clone();
        const count = await this.promiseCount(key);
        const hasKey = count !== 0;
        return hasKey;
    }

    currentStack () {
        const stack = this.isDebugging() ? new Error().stack : "(call IndexedDBFolder.setIsDebugging(true) to get a stack recording)" 
        return stack
    }
    
    async promiseAt (key) {
        await this.promiseOpen();
        const atPromise = Promise.clone();

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
                    atPromise.callResolveFunc(value);
                } else {
                    atPromise.callResolveFunc(undefined);
                }
            } catch (e) {
                this.debugLog(" promiseAt('" +  key + "') caught stack ", stack)
                throw e
            }
        }
        
        request.onerror = (event) => {
            console.log("promiseAt('" + key + "') onerror", event.target.error);
            atPromise.callResolveFunc(undefined);
        }
        
        return atPromise;
    }

    async promiseCount (optionalKey) {
        await this.promiseOpen();
        const countPromise = Promise.clone();
        const objectStore = this.readOnlyObjectStore();
        const request = objectStore.count(optionalKey);
        const stack = this.currentStack();

        request.onsuccess = (event) => {
            const count = request.result;
            if (optionalKey) {
                //console.log("promiseCount " + count + " for optionalKey: '" + optionalKey + "'")
                //debugger;
            }
            countPromise.callResolveFunc(count);
        }
        
        request.onerror = (event) => {
            console.error("promiseCount() onerror: ", event.target.error, " stack: ", stack);
            countPromise.callRejectFunc(event);
        }

        return countPromise;
    }

    async promiseAllKeys () {
        await this.promiseOpen();
        const promise = Promise.clone();

        const objectStore = this.readOnlyObjectStore();
        const request = objectStore.getAllKeys();
        const stack = this.currentStack();

        request.onsuccess = (event) => {
            const keysArray = request.result;
            //console.log("promiseAllKeys ", keysArray);
            promise.callResolveFunc(keysArray);
        }
        
        request.onerror = (event) => {
            console.error("promiseCount() onerror: ", event.target.error, " stack: ", stack);
            promise.callRejectFunc(event);
        }

        return promise;
    }

    // ------------

    /*
    async promiseReadOnlyCursorRequest () {
        const promise = Promise.clone();
        const objectStore = this.readOnlyObjectStore();
        const idbRequest = objectStore.openCursor();

        idbRequest.onsuccess = (event) => {
            promise.callResolveFunc(event);
        }

        idbRequest.onerror = (event) => {
            promise.callRejectFunc(event);
        }

        return promise;
    }

    async promiseForeachKey (aBlock) {
        const event = await this.promiseReadOnlyCursorRequest();
        const promise = Promise.clone();

        const cursor = event.target.result;
        if (cursor) {
            aBlock(cursor.value.key);
            cursor.continue(); // this calls open resolve function again
        } else {
            promise.callResolveFunc()
        }
    }
    */

    // ---------------


    async promiseAsMap () {
        await this.promiseOpen();
        const promise = Promise.clone();

        const objectStore = this.readOnlyObjectStore();
        const request = objectStore.getAll();
        const stack = this.currentStack();

        request.onsuccess = (event) => {
            const results = event.target.result;
            const map = new Map();
            results.forEach(result => {
                map.set(result.key, result.value);
            })
            promise.callResolveFunc(map);
        }

        request.onerror = (event) => {
            promise.callRejectFunc(event);
        }

        return promise;
    }


    async show () {
        const map = await this.promiseAsMap();
        this.debugLog(" " + this.path() + " = " + map.description());
    }

    // removing

    async promiseClear () {
        await this.promiseOpen();
        const clearPromise = Promise.clone();

        const objectStore = this.readWriteObjectStore();
        objectStore._tx._note = "promiseClear";
        
        const request = objectStore.clear();
        const stack = this.currentStack();

        objectStore._tx.oncomplete = (event) => {
            console.log("db promiseClear tx oncomplete");
            clearPromise.callResolveFunc(event);
        };

        request.onsuccess = (event) => {
            console.log("db promiseClear request onsuccess");
            //resolve(event) // use tx oncomplete instead?
        };

        request.onerror = (event) => {
            console.log("db promiseClear request error");
            clearPromise.callRejectFunc(event);
        };

        return clearPromise;
    }


    async promiseDelete () {
        assert(!this.isOpen());
        const deletePromise = Promise.clone();

        const request = window.indexedDB.deleteDatabase(this.storeName());

        request.onerror = (error) => {
            this.debugLog("Error deleting '" + this.storeName() + "'");
            deletePromise.callRejectFunc(error);
        }

        request.onsuccess = (event) => {
            this.debugLog(" deleted successfully '" + this.storeName() + "'");
            deletePromise.callResolveFunc(event);
        }

        this.setDb(null);
        return deletePromise;
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
        this.debugLog(this.path() + " promiseNewTx")
        //debugger;
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

    async promiseAtPut (key, value) {
        await this.promiseOpen();

        if (typeof(value) === "undefined") {
            return this.promiseRemoveAt(key)
        }

        const hasKey = await this.promiseHasKey(key);

        if (hasKey) {
            //console.log("idb YES hasKey promiseUpdate", key)
            return this.promiseUpdate(key, value)
        } 

        //console.log("idb NO hasKey promiseAdd", key)
        return this.promiseAdd(key, value)
    }

    async promiseAssertHasKey (key) {
        const hasKey = await this.promiseHasKey(key);

        if (!hasKey) {
            debugger;
            return Promise.reject(new Error("failed assert"));
        } else {
            return Promise.resolve();
        }
    }

    async promiseUpdate (key, value) { // private
        const tx = await this.promiseNewTx();
        tx.begin();
        tx.setIsDebugging(this.isDebugging());
        tx.atUpdate(key, value);
        return tx.promiseCommit();
    }

    async promiseAdd (key, value) { // private
        const tx = await this.promiseNewTx();
        this.debugLog("idb tx atAdd ", key);
        tx.begin();
        //tx.setIsDebugging(this.isDebugging());
        tx.atAdd(key, value);
        return tx.promiseCommit();
    }

    async promiseRemoveAt (key) {
        await this.promiseOpen();
        const tx = await this.promiseNewTx();
        tx.begin();
        tx.setIsDebugging(this.isDebugging());
        tx.removeAt(key);
        return tx.promiseCommit();
    }

    // test

    static async promiseSelfTest () {
        const folder = IndexedDBFolder.clone()
        await folder.promiseAtPut("test", "x");
        const map = await folder.promiseAsMap();
        console.log("db map = ", map);
        const v = await folder.promiseAt("test");
        console.log("read ", v);
    }

}.initThisClass());
