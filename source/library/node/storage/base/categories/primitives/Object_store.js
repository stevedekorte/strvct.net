"use strict";


/*
const typedArrayClass = Int8Array.__proto__;

Object.defineSlots(typedArrayClass.prototype, {
    _isDeserializing: false
});
*/

(class Object_store extends Object {

    static instanceFromRecordInStore (aRecord, aStore) { // should only be called by Store
        if(!this.shouldStore()) {
            console.warn(this.type() + " instanceFromRecordInStore() attempting to load a record for an object with shouldStore set to false - returning null");
            return null;
        }

        //debugger;
        const instance = this.preClone ? this.preClone() : new this();

        //const instance = new this();
        //instance._isDeserializing = true;
        //instance.setIsDeserializing(true);
        instance.init();
        // caller needs to call finalInit and afterInit
        return instance;
        //return this.clone({ _isDeserializing: true, _store: aStore })
    }

    /*
    isDeserializing () { 
        // e.g. this.initIsDeserializing.call(this, arguments)
        const args = this._cloneArguments
        assert(args !== undefined)
        const isDeserializing = args && args.length && args[0]._isDeserializing
        return isDeserializing
    }
    */

    loadFromRecord (aRecord, aStore) {
        aRecord.entries.forEach((entry) => {
            const k = entry[0]
            const v = entry[1]
            this[k] = aStore.unrefValue(v)
        })
        return this
    }

    recordForStore (aStore) { // should only be called by Store
        assert(this.shouldStore());

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
        const store = PersistentObjectPool.sharedPool();
        return store;
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
