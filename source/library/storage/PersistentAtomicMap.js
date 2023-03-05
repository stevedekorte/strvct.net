"use strict";

/*

    PersistentAtomicMap

    An persistent atomic Map implemented as 
    a read & write cache on top of IndexedDB.
    
    On open, it reads the entire db into a dictionary
    so we can do synchronous reads and writes (avoiding IndexedDB's async API),
    and then call the async commit at the end of the event loop.

    Notes:

    - keys and values are assumed to be strings
	- any exception between begin and commit should halt the app and require a restart to ensure consistency

    API:

    - at(key) returns a value from the internal dict
    - begin() shallow copies the current internal dict
    - atPut(key, value) & removeAt(key)
        applies normal op and adds key to changedKeySet
    - revert() reverts changes since begin
    - commit() constructs a transaction using changedKeySet 
	- at(key) first checks the writeCache beforing checking the readCache
		
    TODO: 
    
    - auto sweep after a write if getting full? 
        
*/

(class PersistentAtomicMap extends ideal.AtomicMap {
    initPrototypeSlots () {
        this.newSlot("name", null)
        this.newSlot("idb", null)
        this.newSlot("txCount", 0)
    }

    init () {
        super.init()
        this.setIsOpen(false)
        this.setIdb(IndexedDBFolder.clone())
        this.setIsDebugging(true)
        this.setName("PersistentAtomicMap")
    }

    setName (aString) {
        this._name = aString
        this.idb().setPath(this.name())
        return this
    }

    // open

    open () {
        throw new Error(this.type() + " synchronous open not supported")
        return this
    }

    setName (aString) {
        this._name = aString
        this.idb().setPath(this.name())
        return this
    }

    promiseOpen () {
        return this.idb().promiseOpen().then(() => { return this.promiseOnOpen()}) // it can deal with multiple calls while it's opening
    }
	
    promiseOnOpen () {
        //debugger;
        console.log(this.typeId() + " promiseOnOpen '" + this.name() + "'")
        this.debugLog(" onOpen() - loading cache")
        
        if (false) {
            debugger;
            return this.promiseClear().then(() => this.promiseLoadMap())
        } 

        return this.promiseLoadMap()
    }

    promiseLoadMap () {
        return this.idb().promiseAsMap().then(map => {
            assert(!Type.isNull(map))
            //console.log(this.debugTypeId() + " onOpen() --- loaded cache with " + this.recordsMap().count() + " keys")
            this.setMap(map)
            console.log("map keys:", map.keysArray())
            this.setIsOpen(true)
            //this.verifySync(callback, errorCallback)
        })
    }

    // --- close ---

    close () {
        if (this.isOpen()) {
            this.idb().close()
        }
        super.close()
        return this
    }
	
    // ---- clear --- 
		
    promiseClear () {
        return new Promise((resolve, reject) => {
            this.idb().promiseClear().then(() => {
                this.map().clear()            
                resolve()
            }, reject)
        })
    }
		
    // --- transactions ---

    newTxId () {
        const count = this.txCount()
        //const s = this.typeId() + "_TX_" + count
        const s = "TX_" + count
        this.setTxCount(count + 1)
        return s
    }

    promiseApplyChanges () { // private -- apply changes to idb, super call will apply to map
        const count = this.changedKeySet().size
	    const tx = this.idb().newTx().setTxId(this.newTxId())
	    tx.begin()
        tx.setIsDebugging(this.isDebugging())
        
        //debugger
        this.changedKeySet().forEachK((k) => {
            const v = this.at(k)
            //debugger;
            if (!this.has(k)) {
                tx.removeAt(k)
            } else {
                const isUpdate = this.snapshot().has(k)
                if (isUpdate) {
                    tx.atUpdate(k, v)
                } else {
                    tx.atAdd(k, v)
                }                
            }
        })
		
        //debugger

        super.applyChanges() // do this last as it will clear the snapshot
		
        this.debugLog(() => "---- " + this.type() + " committed tx with " + count + " writes ----")

        // indexeddb commits on next event loop automatically
        // tx is marked as committed and will throw exception on further writes
        return tx.promiseCommit() //.then(() => this.verifySync())
    }
	
    // --- helpers ---

    verifySync (resolve, reject) {
        const currentMap = this.map().shallowCopy()

        this.idb().promiseAsMap().then(map => {	 
            const isSynced = map.isEqual(currentMap) // works if keys and values are strings
            if (!isSynced) {
                //this.idb().show()
                //console.log("syncdb idb json: ", JSON.stringify(map.asDict(), null, 2))
                throw new Error(his.debugTypeId() + ".verifySync() FAILED")
                reject()
            }
            console.log(this.debugTypeId() + ".verifySync() SUCCEEDED")
            if (resolve) {
                resolve()
            }
        })
    }
}.initThisClass());

