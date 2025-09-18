/**
 * @module library.node.storage.base.categories.primitives
 * @class JsonObject_store
 * @extends Object
 * @classdesc A bit of a hack to deal with slots containing JSON objects.
 * 
 * Serializing:
 * ObjectPool will test to see if the object is a JSON object, and if so, will call:
 * record = JsonObject.instanceForObject(anObject).recordForStore(aStore);
 * 
 * Unserializing:
 * ObjectPool will call instanceFromRecordInStore() which will return a JSON object.
 * 
 * NOTES:
 * We need to deal with special ivars like _mutationObservers and _puuid.
 * - we don't want to store them in the JSON string.
 * - we need to make sure those properties are not enumerable so they don't corrupt collections like Sets, Maps, Dictionaries, Arrays, etc.
 * 
 */

"use strict";

(class JsonObject extends ProtoClass {

    static objectIsJson (anObject) {
        return Type.isDeepJsonType(anObject);
    }

    static instanceForObject (anObject) {
        const instance = new this();
        instance.setJsonString(JSON.stringify(anObject));
        return instance;
    }

    static instanceFromRecordInStore (aRecord, aStore) {
        // this is just a hack to deal with JSON objects
        const instance = JSON.parse(aRecord.jsonString);
        return instance;
    }

    initPrototypeSlots () {
        const slot = this.newSlot("jsonString", null);
        slot.setSlotType("string");
    }

    /**
     * @description Loads the object from a record in the store.
     * @param {Object} aRecord - The record to load from.
     * @param {Object} aStore - The store object.
     * @returns {Object} The loaded object.
     * @category Data Loading
     */
    loadFromRecord (aRecord, aStore) {
        // instance is already loaded by instanceFromRecordInStore()
        return this;
    }

    /**
     * @description Creates a record for the store. Should only be called by Store.
     * @param {Object} aStore - The store object.
     * @returns {Object} The created record.
     * @category Data Storage
     */
    recordForStore (aStore) {
        let type = this.svType();

        return {
            type: type, 
            jsonString: JSON.stableStringify(this.jsonValue()), 
        };
    }

    /**
     * @description Gets the persistent unique identifiers for JSON store.
     * @param {Set} puuids - Set of persistent unique identifiers.
     * @returns {Set} The set of persistent unique identifiers.
     * @category Data Storage
     */
    refsPidsForJsonStore (puuids = new Set()) {
        return puuids;
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
        debugger;
        return this;
    }
 
    /**
     * @description Gets whether the object should be stored.
     * @returns {boolean} Whether the object should be stored.
     * @category Configuration
     */
    shouldStore () {
        return true;
    }
    
}).initThisClass();