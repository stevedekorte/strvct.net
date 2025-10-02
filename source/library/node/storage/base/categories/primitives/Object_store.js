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
     * @category Initialization
     */
    static instanceFromRecordInStoreForObject (aRecord /*, aStore*/) {
        // special case for direct instances of Object
        const instance = JSON.parse(aRecord.jsonString);
        return instance;
    }


    static instanceFromRecordInStore (aRecord, aStore) {

        if (aRecord.type === "Object") {
            return this.instanceFromRecordInStoreForObject(aRecord, aStore);
        }

        if (!this.shouldStore()) {
            console.warn(this.svType() + " instanceFromRecordInStore() attempting to load a record for an object (of type '" + this.svType() + ") with shouldStore set to false - returning null");
            return null;
        }


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
     * @category Data Loading
     */
    loadFromRecord (/*aRecord, aStore*/) {
        // we assume that instances of Object (but not subclasses of Object) are JSON objects
        // and they will already be loaded via instanceFromRecordInStore()
        /*
        aRecord.entries.forEach((entry) => {
            const k = entry[0];
            const v = entry[1];
            this[k] = aStore.unrefValue(v);
        });
        */
        return this;
    }

    isDirectObject () {
        return Object.getPrototypeOf(this) === Object.prototype;
    }

    /**
     * @description Creates a record for the store. Should only be called by Store.
     * @param {Object} aStore - The store object.
     * @returns {Object} The created record.
     * @category Data Storage
     */
    recordForStore (/*aStore*/) {
        // NOTES: this is (typically) only for dictionaries, not for objects.
        // generic storage of (non ProtoClass subclass) objects is not supported.
        const isDirectObject = this.isDirectObject();
        assert(isDirectObject, "Object_store.recordForStore() called with a non direct Object instance");
        //assert(this.shouldStore(), "Object_store.recordForStore() called with an object that shouldStore is false");

        // Any ProtoClass subclass will not call this method as it will use the ProtoClass_store.recordForStore method.
        // We just need to handle dictionaries here i.e.JSON dictionaries.
        // which *might* overide the type property.

        assert(Type.isDeepJsonType(this), "Object_store.recordForStore() on direct Object instance that is not a deep JSON object");

        return {
            type: "Object",
            jsonString: JSON.stableStringify(this) // so we can avoid duplicate writes (if the persistent store checks if the value has changed)
        };

        /*
        let type = "Object";

        if (Type.isFunction(this.type)) { // if we have a type method, use it to get the type
            type = this.svType();
        }

        // Arrays, Maps, and Sets already support recordForStore() ,
        // but we typically want to handle Object instances (but not subclasses of Object) as JSON when possible.
        if (type === "Object" && JsonObject.objectIsJson(this)) { // Hack to deal with Json
            const jsonObject = JsonObject.instanceForObject(this);
            return jsonObject.recordForStore(aStore);
        }

        const entries = [];

        Object.keys(this).forEach((k) => {
            const hiddenKeys = new Set(["_mutationObservers", "_puuid"]);
            if (!hiddenKeys.has(k)) {
                const v = this[k];
                entries.push([k, aStore.refValue(v)]);
            }
        });

        // need to special case objects as they can also be used as JSON dictionaries.
        // if we have a dictionary, we need to store it as a dictionary, not as an object.

        return {
            type: type,
            entries: entries,
        };
        */
    }

    /**
     * @description Gets the persistent unique identifiers for JSON store.
     * @param {Set} puuids - Set of persistent unique identifiers.
     * @returns {Set} The set of persistent unique identifiers.
     * @category Data Storage
     */
    refsPidsForJsonStore (puuids = new Set()) {
        if (Object.hasOwn(this, "*")) {
            puuids.add(this["*"]);
        } else {
            throw new Error("dictionaries are reserved for pointers, but we found a non-pointer");
        }
        return puuids;
    }

    /**
     * @description Gets the default store.
     * @returns {Object} The default store.
     * @category Data Storage
     */
    defaultStore () {
        const store = PersistentObjectPool.sharedPool();
        return store;
    }

    /**
     * @description Called after the object is loaded from the store. Here for subclasses to override.
     * @returns {Object} This object.
     * @category Data Loading
     */
    didLoadFromStore () {
        // See Object_init notes for docs on when/how to use this properly.
        // Here for subclasses to override.
        return this;
    }

    /**
     * @description Sets whether the object should be stored.
     * @param {boolean} aBool - Whether the object should be stored.
     * @returns {Object} This object.
     * @category Configuration
     */
    setShouldStore (aBool) {
        if (aBool != this._shouldStore) {
            //this.willMutate("shouldStore");
            assert(this !== SvGlobals.globals());
            Object.defineSlot(this, "_shouldStore", aBool);
            //this.didMutate("shouldStore");
        }
        return this;
    }

    /**
     * @description Gets whether the object should be stored.
     * @returns {boolean} Whether the object should be stored.
     * @category Configuration
     */
    shouldStore () {
        return this._shouldStore;
        //return Object.getOwnProperty(this._shouldStore);
    }

    /**
     * @description Marks the object as dirty.
     * @returns {Object} This object.
     * @category Data Storage
     */
    markAsDirty () {
        const store = this.defaultStore();
        if (store.hasActiveObject(this)) {
            console.warn(this.logPrefix(), "markAsDirty " + this.svTypeId());
            store.forceAddDirtyObject(this); // not ideal, but let's see if it works
        }
    }

}).initThisCategory();
