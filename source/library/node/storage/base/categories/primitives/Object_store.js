"use strict";


(class Object_store extends Object {

    static instanceFromRecordInStore (aRecord, aStore) { // should only be called by Store
        return this.clone()
    }

    loadFromRecord (aRecord, aStore) {
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

    // ---

    didLoadFromStore () { 
        // See Object_init notes for docs on when/how to use this properly.
        // Here for subclasses to override.
        return this
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
