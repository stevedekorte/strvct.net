/**
 * @module library.node.storage.base.categories.primitives
 * @class JsonObject_store
 * @extends Object
 * @classdesc A bit of a hack to deal with slots containing JSON objects.
 * 
 * This solution to JSON storage runs into problems such as:
 * - dealing with shouldStore()
 * and might better be handled at the slot level.
 */

"use strict";


(class JsonObject extends ProtoClass {

    initPrototypeSlots () {
        this.addSlot("jsonValue", null);
    }

    /**
     * @description Loads the object from a record in the store.
     * @param {Object} aRecord - The record to load from.
     * @param {Object} aStore - The store object.
     * @returns {Object} The loaded object.
     * @category Data Loading
     */
    loadFromRecord (aRecord, aStore) {
        const jsonValue = JSON.parse(aRecord.jsonString);
        this.setJsonString(jsonValue);
        return this;
    }

    /**
     * @description Creates a record for the store. Should only be called by Store.
     * @param {Object} aStore - The store object.
     * @returns {Object} The created record.
     * @category Data Storage
     */
    recordForStore (aStore) {
        let type = this.type();

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
    
}).initThisCategory();