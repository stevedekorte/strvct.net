/**
 * @module library.node.storage.base.categories.primitives
 * @class Object_store
 * @extends Object
 * @classdesc This class extends Object to provide methods for storing and loading objects from a persistent store.
 */

"use strict";

/*
const typedArrayClass = Int8Array.__proto__;

Object.defineSlots(typedArrayClass.prototype, {
    _isDeserializing: false
});
*/

(class Object_store extends Object {

    /**
     * @static
     * @description Creates an instance from a record in the store. Should only be called by Store.
     * @param {Object} aRecord - The record to create the instance from.
     * @param {Object} aStore - The store object.
     * @returns {Object|null} The created instance or null if shouldStore is false.
     */
    static instanceFromRecordInStore (aRecord, aStore) {
        if(!this.shouldStore()) {
            console.warn(this.type() + " instanceFromRecordInStore() attempting to load a record for an object (of type '" +this.type() + ") with shouldStore set to false - returning null");
            return null;
        }

        //debugger;
        const instance = this.preClone ? this.preClone() : new this();
        instance.init();
        // caller needs to call finalInit and afterInit
        return instance;
    }

    /**
     * @description Loads the object from a record in the store.
     * @param {Object} aRecord - The record to load from.
     * @param {Object} aStore - The store object.
     * @returns {Object} The loaded object.
     */
    loadFromRecord (aRecord, aStore) {
        aRecord.entries.forEach((entry) => {
            const k = entry[0]
            const v = entry[1]
            this[k] = aStore.unrefValue(v)
        })
        return this
    }

    /**
     * @description Creates a record for the store. Should only be called by Store.
     * @param {Object} aStore - The store object.
     * @returns {Object} The created record.
     */
    recordForStore (aStore) {
        // NOTES: this is (typically) only for dictionaries, not for objects.
        // generic storage of (non ProtoClass subclass) objects is not supported.
        
        assert(this.shouldStore());

        // Any ProtoClass subclass will not call this method as it will use the ProtoClass_store.recordForStore method.
        // We just need to handle dictionaries here i.e.JSON dictionaries.
        // which *might* overide the type property.

        // QUESTION: why would shouldStore be true for a dictionary?

        let type = "Object";

        if (Type.isFunction(this.type)) {
            type = this.type();
        }

        const entries = [];

        Object.keys(this).forEach((k) => {
            const v = this[k]
            entries.push([k, aStore.refValue(v)])
        });

        // need to special case objects as they can also be used as JSON dictionaries.
        // if we have a dictionary, we need to store it as a dictionary, not as an object.
        
        return {
            type: type, 
            entries: entries, 
        }
    }

    /**
     * @description Gets the persistent unique identifiers for JSON store.
     * @param {Set} puuids - Set of persistent unique identifiers.
     * @returns {Set} The set of persistent unique identifiers.
     */
    refsPidsForJsonStore (puuids = new Set()) {
        if (this.hasOwnProperty("*")) {
            puuids.add(this["*"])
        } else {
            throw new Error("dictionaries are reserved for pointers, but we found a non-pointer")
        }
        return puuids
    }
    
    /**
     * @description Gets the default store.
     * @returns {Object} The default store.
     */
    defaultStore () {
        const store = PersistentObjectPool.sharedPool();
        return store;
    }

    /**
     * @description Called after the object is loaded from the store. Here for subclasses to override.
     * @returns {Object} This object.
     */
    didLoadFromStore () { 
        // See Object_init notes for docs on when/how to use this properly.
        // Here for subclasses to override.
        return this
    }

    /**
     * @description Sets whether the object should be stored.
     * @param {boolean} aBool - Whether the object should be stored.
     * @returns {Object} This object.
     */
    setShouldStore (aBool) {
        if (aBool != this._shouldStore) {
            //this.willMutate("shouldStore")
            assert(this !== getGlobalThis());
            Object.defineSlot(this, "_shouldStore", aBool)
            //this.didMutate("shouldStore")
        }
        return this
    }
 
    /**
     * @description Gets whether the object should be stored.
     * @returns {boolean} Whether the object should be stored.
     */
    shouldStore () {
        return this._shouldStore;
        //return Object.getOwnProperty(this._shouldStore)
    }
    
}).initThisCategory();