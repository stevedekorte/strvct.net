"use strict";

/*

    PersistentAsyncMap

    An async Map wrapper for IndexedDB.

    Public methods:

        asyncOpen(resolve, errorCallback) 
        close()
        asyncClear(resolve)
        asyncHasKey(key, resolve)  // resolve passes true or false
        asyncAt(key, resolve) // resolve passes value or undefined
        asyncAtPut(key, value, resolve, reject) 
        asyncRemoveKey(key, resolve, reject)
        
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

    /*
    promiseOpen () {
        if (!this.isOpen()) {
            this.idb().setPath(this.name())
        }

        const promise = new Promise((resolve, reject) => { 

        })

        this.idb().asyncOpenIfNeeded( () => {
            this.onOpen() 
            promise.resolve()
        }, (error) => { promise.reject(error) } )

        const po = this.idb().promiseOpenIfNeeded()
        po.then(() => { this.onOpen() }, (error) => { promise.reject(error) })
        return po
    }
    */

    asyncOpen (resolve, reject) {
        if (!this.isOpen()) {
            this.idb().setPath(this.name())
        }
        this.idb().asyncOpenIfNeeded( () => {
            this.onOpen() 
            resolve()
        }, reject )
        return this
    }
	
    onOpen () {
        /*
        if (false) {
            this.asyncClear(callback)
        }
        */
    }
	
    assertOpen () {
        assert(this.isOpen())
        return this
    }
	
    // ---- operations ---
		
    asyncClear (resolve, reject) {
        this.idb().asyncClear(resolve, reject) 
    }

    asyncAllKeys (resolve, reject) {
        this.idb().asyncAllKeys(resolve, reject) 
    }

    asyncHasKey (key, resolve, reject) { // resolve passes true or false
        this.idb().asyncHasKey(key, resolve, reject) 
    }

    /*
    async asyncHasKey (key) {
        return new Promise((resolve, reject) => {
            this.idb().hasKey(key, resolve) 
        })
    }
    */

    asyncAt (key, resolve, reject) { // resolve passes value or undefined
        assert(!Type.isNullOrUndefined(resolve))
        this.idb().asyncAt(key, resolve, reject)
    }

    asyncAtPut (key, value, resolve, reject) {
        if (Type.isArrayBuffer(value)) {
            assert(value.byteLength)
        }
        //debugger
        this.assertOpen()
        this.asyncHasKey(key, (hasKey) => {
            if (hasKey) {
                this.asyncUpdate(key, value, resolve, reject)
            } else {
                this.asyncAdd(key, value, resolve, reject)
            }
        }, reject)
    }

    asyncUpdate (key, value, resolve, reject) { // private
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.setSucccessCallback(resolve)
        tx.setErrorCallback(reject)
        tx.atUpdate(key, value)
        tx.commit() 
    }

    asyncAdd (key, value, resolve, reject) { // private
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.setSucccessCallback(resolve)
        tx.setErrorCallback(reject)
        tx.atAdd(key, value)
        tx.commit() 
    }

    asyncRemoveKey (key, resolve, reject) {
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.setSucccessCallback(resolve)
        tx.setErrorCallback(reject)
        tx.removeAt(key)
        tx.commit() 
    }
/*
    promiseRemoveKey (key, resolve, reject) {
        return new Promise(() => {
	    const tx = this.idb().newTx()
            tx.begin()
            tx.setIsDebugging(this.isDebugging())
            tx.setSucccessCallback(resolve)
            tx.setErrorCallback(reject)
            tx.removeAt(key)
            tx.commit() 
        })
    }
*/

}.initThisClass());

/*
debugger;
function promiseOpen2 () {
    return new Promise((resolve, reject) => { 
        //setTimeout(resolve, 10)
        resolve()
        //reject(new Error("boom!"))
    })
}

function promiseOpen1 () {
    return promiseOpen2().then(() => { console.log("onOpen") })
}

promiseOpen1().then(() => {
    console.log("done")
}, (error) => {
    console.log("got error:", error)
})

debugger;
*/