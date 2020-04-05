"use strict"

/*

    PersistentAsyncDictionary

    An async dictionary wrapper for IndexedDB.

    Public methods:

        asyncOpen(callback, errorCallback) 
        close()
        asyncClear(callback)
        hasKey(key, callback)  // callback passes true or false
        asyncAt(key, callback) // callback passes value or undefined
        asyncAtPut(key, value, successCallback, errorCallback) 
        asyncRemoveKey(key, successCallback, errorCallback)
        
*/

window.PersistentAsyncDictionary = class PersistentAsyncDictionary extends ideal.AtomicDictionary {
    initPrototype () {
        this.newSlot("name", "PersistentAsyncDictionary")
        this.newSlot("idb", null)
    }

    init() {
        super.init()
        this.setIsOpen(false)
        this.setIdb(IndexedDBFolder.clone())
        //this.setIsDebugging(true)
    }
    
    // open

    assertAccessible () {
        super.assertAccessible()
        this.assertOpen()
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

    asyncOpen (callback, errorCallback) {
        this.idb().setPath(this.name())
        this.idb().asyncOpenIfNeeded( () => this.onOpen(callback), errorCallback )
        return this
    }
	
    onOpen (callback, errorCallback) {
        // load the cache
        this.debugLog(" onOpen() - loading cache")
        
        if (false) {
            this.asyncClear(callback)
        } else {
            this.idb().asyncAsJson((dict) => {
                //console.log(this.type() + " onOpen() --- loaded cache with " + Object.keys(dict).length + " keys")
                this.setJsDict(dict)
                this.setIsOpen(true)
                if (callback) {
                    callback()
                }
                //this.verifySync()
            })
        }
    }
	
    assertOpen () {
        assert(this.isOpen())
        return this
    }
	
    // ---- operations ---
		
    asyncClear (callback) {
        this.idb().asyncClear(callback) 
    }

    hasKey (key, callback) { // callback passes true or false
        this.idb().heyKey(callback) 
    }

    asyncAt (key, callback) { // callback passes value or undefined
        assert(!Type.isNullOrUndefined(callback))
        this.idb().asyncAt(key, callback)
    }

    asyncAtPut (key, value, successCallback, errorCallback) {
        this.hasKey(key, (hasKey) => {
            if (hasKey) {
                this.asyncUpdate(key, value, successCallback, errorCallback)
            } else {
                this.asyncAdd(key, value, successCallback, errorCallback)
            }
        })
    }

    asyncUpdate (key, value, successCallback, errorCallback) { // private
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.setSucccessCallback(successCallback)
        tx.setErrorCallback(errorCallback)
        tx.atUpdate(k, v)
        tx.commit() 
    }

    asyncAdd (key, value, successCallback, errorCallback) { // private
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.setSucccessCallback(successCallback)
        tx.setErrorCallback(errorCallback)
        tx.atAdd(k, v)
        tx.commit() 
    }

    asyncRemoveKey (key, successCallback, errorCallback) {
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.setSucccessCallback(successCallback)
        tx.setErrorCallback(errorCallback)
        tx.removeAt(k)
        tx.commit() 
    }

}.initThisClass()

