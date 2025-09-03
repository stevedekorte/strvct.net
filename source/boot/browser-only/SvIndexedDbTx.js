/**
 * @module boot
 */

"use strict";

/**
 * @class SvIndexedDbTx
 * @extends Base
 * @classdesc Abstraction of a single IndexedDB transaction.
 */
(class SvIndexedDbTx extends SvBase {

    /** 
     * Initialize prototype slots
     */
    initPrototypeSlots () {
        /**
         * @member {object} dbFolder - Database folder object
         * @category Database
         */
        this.newSlot("dbFolder", null)

        /**
         * @member {object} objectStore - IndexedDB object store
         * @category Database
         */
        this.newSlot("objectStore", null)

        /**
         * @member {object} tx - IndexedDB transaction object
         * @category Transaction
         */
        this.newSlot("tx", null)

        /**
         * @member {Array} requests - Array of transaction requests
         * @category Transaction
         */
        this.newSlot("requests", [])

        /**
         * @member {boolean} isCommitted - Flag indicating if transaction is committed
         * @category Transaction
         */
        this.newSlot("isCommitted", false) // set to true when tx.commit() is called

        /**
         * @member {boolean} isAborted - Flag indicating if transaction is aborted
         * @category Transaction
         */
        this.newSlot("isAborted", false)

        /**
         * @member {boolean} isCompleted - Flag indicating if transaction is completed
         * @category Transaction
         */
        this.newSlot("isCompleted", false) // set to true after tx commit onsuccess callback received 

        /**
         * @member {Error} txRequestStack - Stack trace of transaction request
         * @category Debugging
         */
        this.newSlot("txRequestStack", null)

        /**
         * @member {object} options - Transaction options
         * @category Transaction
         */
        this.newSlot("options", { "durability": "strict" })

        /**
         * @member {string} txId - Transaction ID
         * @category Transaction
         */
        this.newSlot("txId", null)

        /**
         * @member {Promise} promiseForCommit - Promise for transaction commit
         * @category Transaction
         */
        this.newSlot("promiseForCommit", null)

        /**
         * @member {Promise} promiseForFinished - Promise for transaction finish
         * @category Transaction
         */
        this.newSlot("promiseForFinished", null)

        /**
         * @member {number} timeoutInMs - Transaction timeout in milliseconds
         * @category Transaction
         */
        this.newSlot("timeoutInMs", 1000);
    }
  
    initPrototype () {
    }

    /**
     * Initialize the instance
     * @category Initialization
     */
    init () {
        super.init()
        this.setPromiseForFinished(Promise.clone());
        //this.setIsDebugging(false) // this will be overwritten by db with it's own isDebugging setting
    }

    /**
     * Mark the transaction as completed
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    markCompleted () {
        assert(!this.isCompleted());
        this.setIsCompleted(true);
        this.markResolved();
        return this
    }

    /**
     * Mark the transaction as rejected
     * @param {Error} error - The error that caused the rejection
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    markRejected (error) {
        this.promiseForFinished().callRejectFunc(error);
        return this
    }

    /**
     * Mark the transaction as resolved
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    markResolved () {
        this.promiseForFinished().callResolveFunc();
        return this
    }

    /*
    isDebugging () {
        return true
    }
    */

    /**
     * Get the database object
     * @returns {object}
     * @category Database
     */
    db () {
        return this.dbFolder().db()
    }
    
    /**
     * Get the store name
     * @returns {string}
     * @category Database
     */
    storeName () {
        return this.dbFolder().storeName()
    }
	
    // --- being and commit ---

    /**
     * Assert that the transaction is not committed
     * @category Transaction
     */
    assertNotCommitted () {
	    assert(this.isCommitted() === false)
    }

    /**
     * Create a new transaction
     * @returns {object}
     * @category Transaction
     */
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

    /**
     * Begin the transaction
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    begin () {
        this.logDebug(this.dbFolder().path() + " TX BEGIN ")
        this.assertNotCommitted()
        this.setTxRequestStack(new Error().stack)
	    const tx = this.newTx()
        const objectStore = tx.objectStore(this.storeName());
        this.setObjectStore(objectStore)
        return this
    }
	
    /**
     * Abort the transaction
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    abort () {
	    this.assertNotCommitted();
	    this.tx().abort(); // how does this get rejected?
        this.setIsAborted(true);
        this.markResolved();
	    return this
    }

    // --- debugging ---

    /**
     * Show transaction details
     * @category Debugging
     */
    show () {
        this.log(this.description())
        this.showTxRequestStack()
    }

    /**
     * Get transaction description
     * @returns {string}
     * @category Debugging
     */
    description () {
        let s = "db: " + this.dbFolder().path() + " tx:\n"
        this.requests().forEach(rq => {
            s += "    " + JSON.stringify({ action: rq._action, key: rq._key, value: rq._value })
        })
        return s
    }

    /**
     * Show transaction request stack
     * @category Debugging
     */
    showTxRequestStack () {
        const rs = this.txRequestStack()
        if (rs) { 
            console.error("error stack ", rs)
        }
    }

    // ----------------------------------------

    /**
     * Check if the transaction is finished
     * @returns {boolean}
     * @category Transaction
     */
    isFinished () {
        return this.isAborted() || this.isCompleted()
    }

    /**
     * Promise to commit the transaction
     * @returns {Promise}
     * @category Transaction
     */
    promiseCommit () {
        assert(!this.isFinished())

        const tx = this.tx()
        
        tx.oncomplete = (/*event*/) => { 
            this.logDebug(" COMMIT COMPLETE")
            this.markCompleted()
        }

        tx.onerror = (error) => { 
            this.markRejected(error)
        }

        this.logDebug(" COMMITTING")
        tx.commit()

        return this.promiseForFinished()
    }

	
    // --- helpers ---

    /**
     * Push a request to the transaction
     * @param {object} aRequest - The request to push
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    pushRequest (aRequest) {
	    this.assertNotCommitted()

        const requestStack = this.isDebugging() ? new Error().stack : null;

        aRequest.onerror = (event) => {
		    const fullDescription = "objectStore:'" + this.dbFolder().path() + "' '" + aRequest._action + "' key:'" + aRequest._key + "' error: '" + event.target.error + "'";
		    this.logDebug(fullDescription)
		    if (requestStack) { 
                console.error("error stack ", requestStack)
            }
		  	throw new Error(fullDescription)
        }

        this.requests().push(aRequest)
	    return this
    }

    /**
     * Assert that the key and value are valid
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @category Validation
     */
    assertValidKeyValue (key, value) {
        assert(typeof(key) === "string")
        assert(typeof(value) === "string" || (typeof(value) === "object" && Object.getPrototypeOf(value) === ArrayBuffer.prototype))
    }
	
    /**
     * Create an entry object for key and value
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @returns {object}
     * @category Utility
     */
    entryForKeyAndValue (key, value) {
        this.assertValidKeyValue(key, value)
        return { key: key, value: value }
    }
	
    // --- operations ----
	
    /**
     * Add an entry to the object store
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @returns {SvIndexedDbTx}
     * @category Database Operations
     */
    atAdd (key, value) {
        this.assertValidKeyValue(key, value)
        this.assertNotCommitted()
        
        this.logDebug(() => "ADD " + key + " '...'")

        const entry = this.entryForKeyAndValue(key, value)
        const request = this.objectStore().add(entry);
        request._action = "add"
        request._key = key 
        request._value = value 
        this.pushRequest(request)
        return this
    }

    /**
     * Update an entry in the object store
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @returns {SvIndexedDbTx}
     * @category Database Operations
     */
    atUpdate (key, value) {
        this.assertValidKeyValue(key, value)
	    this.assertNotCommitted()

        this.logDebug(() => "UPDATE " + key)

        const entry = this.entryForKeyAndValue(key, value)
        const request = this.objectStore().put(entry);
        request._action = "put"
        request._key = key
        request._value = value 
        this.pushRequest(request)
        return this
    }
    
    /**
     * Remove an entry from the object store
     * @param {string} key - The key
     * @returns {SvIndexedDbTx}
     * @category Database Operations
     */
    removeAt (key) {
	    this.assertNotCommitted()

        this.logDebug(() => "REMOVE " + key)

        const request = this.objectStore().delete(key);
        request._action = "remove"
        request._key = key
        this.pushRequest(request)
        return this
    }

    /**
     * Get debug type ID
     * @returns {string}
     * @category Debugging
     */
    debugTypeId () {
        return this.dbFolder().debugTypeId() + " " + this.txId() //super.debugTypeId()
    }
    
}.initThisClass());