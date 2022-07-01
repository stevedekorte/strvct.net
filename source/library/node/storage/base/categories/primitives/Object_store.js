"use strict";


(class Object_store extends Object {

    static instanceFromRecordInStore (aRecord, aStore) { // should only be called by Store
        assert(aRecord.type === "Object")
        const obj = {}
        obj.loadFromRecord(aRecord, aStore)
        return obj
    }

    loadFromRecord (aRecord, aStore) {
        assert(aRecord.type === "Object")
        aRecord.entries.forEach((entry) => {
            const k = entry[0]
            const v = entry[1]
            this[k] = aStore.unrefValue(v)
        })
        return this
    }

    recordForStore (aStore) { // should only be called by Store
        const entries = []

        Object.keys(this).forEach((k) => {
            const v = this[k]
            entries.push([k, aStore.refValue(v)])
        })

        return {
            type: this.type(), 
            entries: entries, 
        }
    }

    /*
    shouldStore () {
        return this._shouldStore
    }
    */

    refsPidsForJsonStore (puuids = new Set()) {
        if (this.hasOwnProperty("*")) {
            puuids.add(this["*"])
        } else {
            throw new Error("dictionaries are reserved for pointers, but we found a non-pointer")
        }
        return puuids
    }
    
    defaultStore () {
        return PersistentObjectPool.shared()
    }

    scheduleSyncToStore (slotName) {
        this.didMutate()
    }

    scheduleDidLoadFromStore () {
        //SyncScheduler.shared().scheduleTargetAndMethod(this, "didLoadFromStore")
        this.didLoadFromStore()
    }
 
    // ---

    didLoadFromStore () {
        // for subclasses to override
    }

    // --- shouldStore ---
 
    setShouldStore (aBool) {
        if (aBool != this._shouldStore) {
            //this.willMutate("shouldStore")
            Object.defineSlot(this, "_shouldStore", aBool)
            //this.didMutate("shouldStore")
        }
        return this
    }
 
    shouldStore () {
        return this._shouldStore
    }
    
}).initThisCategory();
