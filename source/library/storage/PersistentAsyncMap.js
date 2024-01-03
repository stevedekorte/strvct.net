"use strict";

/*

    PersistentAsyncMap  

    An async Map wrapper for IndexedDB.

    Public methods:

        promiseOpen() 
        close()
        promiseClear()
        promiseAllKeys()
        promiseHasKey(key)  // resolve passes true or false
        promiseAt(key) // resolve passes value or undefined
        promiseAtPut(key, value) // if value is undefined, key is deleted
        promiseRemoveKey(key)

    Notes:

    To avoid having to wait for opening all async maps at the top level,
    promiseOpen() is implicitly called for all other APIs.

    Writing an undefined value will remove the key.
        
*/

(class PersistentAsyncMap extends ProtoClass {
    initPrototypeSlots () {
        this.newSlot("name", "PersistentAsyncDictionary")
        this.newSlot("idb", null)
    }

    init () {
        super.init()
        this.setIdb(IndexedDBFolder.clone())
        this.setIsDebugging(false)
    }
    
    // open

    assertAccessible () {
        super.assertAccessible()
        this.assertOpen()
    }

    isOpen () {
        return this.idb().isOpen()
    }

    open () {
        throw new Error(this.type() + " synchronous open not supported")
        return this
    }

    close () {
        if (this.isOpen()) {
            this.idb().close()
            this.setIsOpen(false)
        }
        return this
    }

    async promiseOpen () {
        if (!this.isOpen()) {
            this.idb().setPath(this.name());
        }
        await this.idb().promiseOpen();
        await this.promiseOnOpen() ;
    }
	
    promiseOnOpen () {
        //return this.promiseClear()
    }
	
    assertOpen () {
        assert(this.isOpen())
        return this
    }
	
    // ---- operations ---

    async promiseClear () {
        await this.promiseOpen();
        await this.idb().promiseClear();
    }

    async promiseAllKeys () {
        await this.promiseOpen();
        await this.idb().promiseAllKeys();
    }

    async promiseHasKey (key) { // resolve passes true or false
        await this.promiseOpen();
        return this.idb().promiseHasKey(key);
    }

    async promiseAt (key) { // resolve passes value or undefined
        await this.promiseOpen();
        return this.idb().promiseAt(key);
    }

    async promiseAtPut (key, value) {
        await this.promiseOpen();
        return this.idb().promiseAtPut(key, value);
    }

    async promiseRemoveAt (key) {
        await this.promiseOpen();
        return this.idb().promiseRemoveAt(key, value);
    }

}.initThisClass());
