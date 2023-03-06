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

    promiseOpen () {
        if (!this.isOpen()) {
            this.idb().setPath(this.name())
        }
        return this.idb().promiseOpen().then(() => {
            return this.promiseOnOpen() 
        })
    }
	
    promiseOnOpen () {
        //return this.promiseClear()
    }
	
    assertOpen () {
        assert(this.isOpen())
        return this
    }
	
    // ---- operations ---

    promiseClear () {
        return this.promiseOpen().then(() => {
            return this.idb().promiseClear()
        })
    }

    promiseAllKeys () {
        return this.promiseOpen().then(() => {
            return this.idb().promiseAllKeys()
        })
    }

    promiseHasKey (key) { // resolve passes true or false
        return this.promiseOpen().then(() => {
            return this.idb().promiseHasKey(key)
        })
    }

    promiseAt (key) { // resolve passes value or undefined
        return this.promiseOpen().then(() => {
            return this.idb().promiseAt(key)
        })
    }

    promiseAtPut (key, value) {
        return this.promiseOpen().then(() => {
            return this.promiseHasKey(key, (hasKey) => {
                if (Type.isUndefined(key)) {
                    return this.promiseRemoveAt(key)
                } else if (hasKey) {
                    return this.promiseUpdate(key, value)
                } else {
                    return this.promiseAdd(key, value)
                }
            })
        })
    }

    promiseUpdate (key, value) { // private
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.atUpdate(key, value)
        return tx.promiseCommit() 
    }

    promiseAdd (key, value) { // private
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.atAdd(key, value)
        return tx.promiseCommit() 
    }

    promiseRemoveAt (key) {
        return this.promiseOpen().then(() => {
            const tx = this.idb().newTx()
            tx.begin()
            tx.setIsDebugging(this.isDebugging())
            tx.removeAt(key)
            return tx.promiseCommit() 
        })
    }

}.initThisClass());
