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
        promiseAtPut(key, value) 
        promiseRemoveKey(key)
        
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
        return new Promise((resolve, reject) => {
            if (false) {
                return this.promiseClear()
            } 
            resolve()
        })
    }
	
    assertOpen () {
        assert(this.isOpen())
        return this
    }
	
    // ---- operations ---

    promiseClear () {
        return this.idb().promiseClear() 
    }

    promiseAllKeys () {
        return this.idb().promiseAllKeys()
    }

    promiseHasKey (key) { // resolve passes true or false
        return this.idb().promiseHasKey(key) 
    }

    promiseAt (key) { // resolve passes value or undefined
        return this.idb().promiseAt(key)
    }

    promiseAtPut (key, value) {
        if (Type.isArrayBuffer(value)) {
            assert(value.byteLength)
        }

        this.assertOpen()

        return this.promiseHasKey(key, (hasKey) => {
            if (hasKey) {
                return this.promiseUpdate(key, value, resolve, reject)
            } else {
                return this.promiseAdd(key, value, resolve, reject)
            }
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

    promiseRemoveKey (key) {
	    const tx = this.idb().newTx()
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        tx.removeAt(key)
        return tx.promiseCommit() 
    }

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