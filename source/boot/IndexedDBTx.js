"use strict";

/* 

    IndexedDBTx

    Abstraction of a single IndexedDB transaction.

*/

(class IndexedDBTx extends Base {

    initPrototypeSlots () {
        this.newSlot("dbFolder", null)
        this.newSlot("objectStore", null)
        this.newSlot("tx", null)
        this.newSlot("requests", [])
        this.newSlot("isCommitted", false) // set to true when tx.commit() is called
        this.newSlot("isAborted", false)
        this.newSlot("isCompleted", false) // set to true after tx commit onsuccess callback received 
        this.newSlot("txRequestStack", null)
        this.newSlot("options", { "durability": "strict" })
        this.newSlot("txId", null)
        this.newSlot("promiseForCommit", null)
        this.newSlot("promiseForFinished", null)
        this.newSlot("timeoutInMs", 1000);
    }
  
    initPrototype () {
    }

    init () {
        super.init()
        this.setPromiseForFinished(Promise.clone());
        //this.setIsDebugging(false) // this will be overwritten by db with it's own isDebugging setting
    }

    markCompleted () {
        assert(!this.isCompleted());
        this.setIsCompleted(true);
        this.markResolved();
        return this
    }

    markRejected (error) {
        this.promiseForFinished().callRejectFunc(error);
        return this
    }

    markResolved () {
        this.promiseForFinished().callResolveFunc();
        return this
    }

    /*
    isDebugging () {
        return true
    }
    */

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
        assert(this.tx() === null)
        const tx = this.db().transaction(this.storeName(), "readwrite", this.options())
        tx.onerror    = (error) => { 
            debugger
            throw new Error(error) 
        }
        this.setTx(tx)
        return tx
    }

    begin () {
        this.debugLog(this.dbFolder().path() + " TX BEGIN ")
     //   debugger;
        //this.debugLog("BEGIN " + this.txId())
	    this.assertNotCommitted()
        //this.setTxRequestStack(this.isDebugging() ? new Error().stack : null)
        this.setTxRequestStack(new Error().stack)
	    const tx = this.newTx()
        const objectStore = tx.objectStore(this.storeName());
        this.setObjectStore(objectStore)
        return this
    }
	
    abort () {
	    this.assertNotCommitted();
	    this.tx().abort(); // how does this get rejected?
        this.setIsAborted(true);
        this.markResolved();
	    return this
    }

    // --- debugging ---

    show () {
        console.log(this.description())
        this.showTxRequestStack()
    }

    description () {
        let s = "db: " + this.dbFolder().path() + " tx:\n"
        this.requests().forEach(rq => {
            //s += "    " + rq._action + "' key:'" + rq._key + "\n"
            s += "    " + JSON.stringify({ action: rq._action, key: rq._key, value: rq._value })
        })
        return s
    }

    showTxRequestStack () {
        const rs = this.txRequestStack()
        if (rs) { 
            console.error("error stack ", rs)
        }
    }

    // ----------------------------------------

    isFinished () {
        return this.isAborted() || this.isCompleted()
    }

    promiseCommit () {
        assert(!this.isFinished())

        // don't return promiseForFinished here as calling
        // promiseForFinished creates the promise

        const tx = this.tx()
        
        tx.oncomplete = (event) => { 
            this.debugLog(" COMMIT COMPLETE")
            //debugger
            this.markCompleted()
        }

        tx.onerror = (error) => { 
            //debugger;
            this.markRejected(error)
        }

        //setTimeout(() => this.onTimeout(), this.timeoutInMs())

        this.debugLog(" COMMITTING")
        tx.commit()

        return this.promiseForFinished()
    }

	
    // --- helpers ---

    pushRequest (aRequest) {
	    this.assertNotCommitted()

        const requestStack = this.isDebugging() ? new Error().stack : null;

        /*
        aRequest.onsuccess = (event) => {
		    const fullDescription = "objectStore:'" + this.dbFolder().path() + "' '" + aRequest._action + "' key:'" + aRequest._key + "'";
            //console.log("SUCCESS: " + fullDescription)
        }
        */

        aRequest.onerror = (event) => {
		    const fullDescription = "objectStore:'" + this.dbFolder().path() + "' '" + aRequest._action + "' key:'" + aRequest._key + "' error: '" + event.target.error + "'";
		    this.debugLog(fullDescription)
		    if (requestStack) { 
                console.error("error stack ", requestStack)
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

    assertValidKeyValue (key, value) {
        assert(typeof(key) === "string")
        assert(typeof(value) === "string" || (typeof(value) === "object" && Object.getPrototypeOf(value) === ArrayBuffer.prototype))
    }
	
    entryForKeyAndValue (key, value) {
        this.assertValidKeyValue(key, value)
        return { key: key, value: value }
    }
	
    // --- operations ----
	
    atAdd (key, value) {
        this.assertValidKeyValue(key, value)
        this.assertNotCommitted()
        
        //this.debugLog(() => " add " + key + " '" + object + "'")
        this.debugLog(() => "ADD " + key + " '...'")

        const entry = this.entryForKeyAndValue(key, value)
        const request = this.objectStore().add(entry);
        request._action = "add"
        request._key = key 
        request._value = value 
        this.pushRequest(request)
        return this
    }

    atUpdate (key, value) {
        this.assertValidKeyValue(key, value)
	    this.assertNotCommitted()

        this.debugLog(() => "UPDATE " + key)

        const entry = this.entryForKeyAndValue(key, value)
        const request = this.objectStore().put(entry);
        request._action = "put"
        request._key = key
        request._value = value 
        this.pushRequest(request)
        return this
    }
    
    removeAt (key) {
	    this.assertNotCommitted()

        this.debugLog(() => "REMOVE " + key)

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




