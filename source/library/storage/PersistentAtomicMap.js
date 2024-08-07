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
        {
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("idb", null);
            slot.setSlotType("IndexedDBFolder");
        }
        {
            const slot = this.newSlot("txCount", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("isApplying", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init()
        this.setIsOpen(false)
        this.setIdb(IndexedDBFolder.clone())
        this.setIsDebugging(false)
        this.setName("PersistentAtomicMap")
    }

    setName (aString) {
        this._name = aString
        this.idb().setPath(this.name())
        return this
    }

    // open

    isOpen () {
        return this.idb().isOpen()
    }

    open () {
        throw new Error(this.type() + " synchronous open not supported")
        return this
    }

    setName (aString) {
        this._name = aString
        this.idb().setPath(this.name())
        return this
    }

    async promiseOpen () {
        this.debugLog(() => "promiseOnOpen() '" + this.name() + "'");
        await this.idb().promiseOpen();
        return this.promiseOnOpen(); // it can deal with multiple calls while it's opening
    }
	
    async promiseOnOpen () {
        if (false) {
            debugger;
            this.debugLog("onOpen() - CLEARING BEFORE OPEN");
             await this.promiseClear();
        } 

        this.debugLog("onOpen() - loading cache");
        await this.promiseLoadMap();
    }

    async promiseLoadMap () {
        const map = await this.idb().promiseAsMap();
        assert(!Type.isNull(map));
        //console.log(this.debugTypeId() + " onOpen() --- loaded cache with " + this.recordsMap().count() + " keys")
        this.setMap(map);
        //console.log("map keys:", map.keysArray())
        this.setIsOpen(true);
        //this.verifySync(callback, errorCallback)
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
		
    async promiseClear () {
        await this.idb().promiseClear();
        this.map().clear();
    }
		
    // --- transactions ---

    newTxId () {
        const count = this.txCount()
        //const s = this.typeId() + "_TX_" + count
        const s = "TX_" + count
        this.setTxCount(count + 1)
        return s
    }

    async promiseApplyChanges () {
        //console.log(this.name() + " --- promiseApplyChanges ---")
        //debugger
        const count = this.changedKeySet().size
        const tx = this.idb().privateNewTx();
        //const tx = await this.idb().promiseNewTx();
        await this.applyChangesToTx(tx);
        //return tx.promiseCommit();
    }

    async applyChangesToTx (tx) {
        //debugger
        assert(!this.isApplying())
        this.setIsApplying(true)

        tx.setTxId(this.newTxId())
        tx.setIsDebugging(this.isDebugging())
        tx.begin()
        this.changedKeySet().forEachK((k) => {
            const v = this.at(k)
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
        
        super.applyChanges() // do this last as it will clear the snapshot
        
        this.debugLog(() => "---- " + this.type() + " committed tx with " + count + " writes ----");

        // indexeddb commits on next event loop automatically
        // tx is marked as committed and will throw exception on further writes

        await tx.promiseCommit();
        this.setIsApplying(false);
        //await this.promiseVerifySync();
    }
	
    // --- helpers ---

    async promiseVerifySync () {
        const currentMap = this.map().shallowCopy();
        const map = await this.idb().promiseAsMap();

        const isSynced = map.isEqual(currentMap); // works if keys and values are strings
        if (isSynced) {
            this.debugLog(".verifySync() SUCCEEDED");
        } else {
            //this.idb().show()
            //console.log("syncdb idb json: ", JSON.stringify(map.asDict(), null, 2))
            throw new Error(his.debugTypeId() + ".verifySync() FAILED");
            debugger;
        }
    }
    
}.initThisClass());

