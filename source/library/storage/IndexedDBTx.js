"use strict";

/* 

    IndexedDBTx

    Abstraction of a single IndexedDB transaction.

*/

(class IndexedDBTx extends ProtoClass {

    initPrototypeSlots () {
        this.newSlot("dbFolder", null)
        this.newSlot("objectStore", null)
        this.newSlot("tx", null)
        this.newSlot("requests", [])
        this.newSlot("isCommitted", false)
        this.newSlot("isAborted", false)
        this.newSlot("txRequestStack", null)
        this.newSlot("options", { "durability": "strict" })
        this.newSlot("txId", null)
    }

    init () {
        super.init()
        this.setIsDebugging(true)
    }

    isDebugging () {
        return true
    }

    db () {
        return this.dbFolder().db()
    }
    
    storeName () {
        return this.dbFolder().storeName()
    }
	
    // --- being and commit ---

    assertNotCommitted () {
	    assert(this.isCommitted() === false)
    }

    newTx () {
        assert(Type.isNullOrUndefined(this.tx()))
        const tx = this.db().transaction(this.storeName(), "readwrite", this.options())
        tx.onerror    = (error) => { 
            debugger
            throw new Error(error) 
        }
        this.setTx(tx)
        return tx
    }

    begin () {
        this.debugLog("BEGIN ")
        //this.debugLog("BEGIN " + this.txId())
	    this.assertNotCommitted()
        this.setTxRequestStack(this.isDebugging() ? new Error().stack : null)
	    const tx = this.newTx()
        const objectStore = tx.objectStore(this.storeName());
        this.setObjectStore(objectStore)
        return this
    }

    showTxRequestStack () {
        const rs = this.txRequestStack()
        if (rs) { 
            console.log("error stack ", rs)
        }
    }
	
    abort () {
	    this.assertNotCommitted()
	    this.tx().abort() // how does this get rejected?
        this.setIsAborted(true)
	    return this
    }

    isFinished () {
        return this.isAborted() || this.isCommitted()
    }

    promiseCommit () {
        this.debugLog("promiseCommit ")

        return new Promise((resolve, reject) => {
            this.assertNotCommitted()
            this.setIsCommitted(true)
            const tx = this.tx()

            if (Type.isUndefined(tx.commit)) {
                reject(new Error("WARNING: no IDBTransation.commit method found for this browser"))
            } else {
                tx.oncomplete = (event) => { 
                    this.debugLog(" COMMIT COMPLETE")
                    //debugger
                    resolve(event) 
                }
                tx.onerror = (error) => { 
                    debugger; 
                    reject(error)
                }
                this.debugLog(" COMMITTING")
                tx.commit()
            }
        })
    }
	
    // --- helpers ---
	
    pushRequest (aRequest) {
	    this.assertNotCommitted()

        const requestStack = this.isDebugging() ? new Error().stack : null;

        aRequest.onerror = (event) => {
		    const fullDescription = "objectStore:'" + this.dbFolder().path() + "' '" + aRequest._action + "' key:'" + aRequest._key + "' error: '" + event.target.error + "'"
		    this.debugLog(fullDescription)
		    if (requestStack) { 
                console.log("error stack ", requestStack)
            }
		  	throw new Error(fullDescription)
        }

        /*
        aRequest.onsuccess = (event) => {
            // report the success of the request (this does not mean the item
            // has been stored successfully in the DB - for that you need transaction.onsuccess)
        }
        */

        this.requests().push(aRequest)
	    return this
    }
	
    entryForKeyAndValue (key, value) {
        assert(Type.isString(key))
        assert(Type.isString(value) || Type.isArrayBuffer(value))
        return { key: key, value: value }
    }
	
    // --- operations ----
	
    atAdd (key, value) {
        //debugger
        //assert(!this.hasKey(key))

        assert(Type.isString(key))
        assert(Type.isString(value) || Type.isArrayBuffer(value))
        this.assertNotCommitted()
        
        //this.debugLog(() => " add " + key + " '" + object + "'")
        this.debugLog(() => " ADD " + key + " '...'")

        const entry = this.entryForKeyAndValue(key, value)
        const request = this.objectStore().add(entry);
        request._action = "add"
        request._key = key 
        this.pushRequest(request)
        return this
    }

    atUpdate (key, value) {
        //assert(!this.hasKey(key))

        assert(Type.isString(key))
        assert(Type.isString(value) || Type.isArrayBuffer(value))
	    this.assertNotCommitted()

        this.debugLog(() => " UPDATE " + key)

        const entry = this.entryForKeyAndValue(key, value)
        const request = this.objectStore().put(entry);
        request._action = "put"
        request._key = key
        this.pushRequest(request)
        return this
    }
    
    removeAt (key) {
	    this.assertNotCommitted()

        this.debugLog(() => " REMOVE " + key)

        const request = this.objectStore().delete(key);
        request._action = "remove"
        request._key = key
        this.pushRequest(request)
        return this
    }

    debugTypeId () {
        return this.dbFolder().debugTypeId() + " " + this.txId() //super.debugTypeId()
    }
    
}.initThisClass());




