/**
 * @module library.node.storage.nodes.inspectors
 * @class BMDataStoreRecord
 * @extends BMFieldSetNode
 * @classdesc A visible representation of a storage record.
 */
"use strict";

(class BMDataStoreRecord extends BMFieldSetNode {
    
    /**
     * Initializes the prototype slots for the BMDataStoreRecord.

     */
    initPrototypeSlots () {
        /**
         * @property {String} key
         */
        {
            const slot = this.newSlot("key", null);
            slot.setSlotType("String");
        }
        /**
         * @property {Object} store
         */
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("Object"); // TODO: add store protocol
        }
    }

    /**
     * Initializes the prototype.

     */
    initPrototype () {
        this.setCanDelete(false); // too dangerous
    }

    /**
     * Prepares the record for first access.

     */
    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        const jsonField = BMTextAreaField.clone().setKey("recordString")
        jsonField.setValueMethod("recordString").setValueIsEditable(false).setIsMono(true)
        this.addField(jsonField)

        this.referencedRecords().forEach((aRecord) => {
            const node = BMDataStoreRecord.forRecord(aRecord)
            this.addSubnode(node)
        })
    }

    /**
     * Returns the record associated with this BMDataStoreRecord.

     * @returns {Object} The associated record.
     */
    record () {
        return this.store().recordForPid(this.key())
    }

    /**
     * Sets the record string.

     * @param {string} s - The record string to set.
     * @throws {Error} Always throws an error as it's not editable.
     */
    setRecordString (s) {
        throw new Error("not editable")
    }

    /**
     * Returns the record as a JSON string.

     * @returns {string} The record as a JSON string.
     */
    recordString () {
        return JSON.stableStringify(this.record(), null, 2)
    }

    /**
     * Returns an array of referenced records.

     * @returns {Array} An array of referenced records.
     */
    referencedRecords () {
        return this.referencedPidSet().map( pid => this.defaultStore().recordForPid(pid) )
    }

    /**
     * Returns the set of referenced PIDs.

     * @returns {Set} The set of referenced PIDs.
     */
    referencedPidSet () {
        return this.defaultStore().refSetForPuuid(this.record().id)
    }

    /**
     * Creates a BMDataStoreRecord for a given record.

     * @static
     * @param {Object} aRecord - The record to create a BMDataStoreRecord for.
     * @returns {BMDataStoreRecord} The created BMDataStoreRecord.
     */
    static forRecord (aRecord) {
        const subnode = BMDataStoreRecord.clone()
        subnode.setTitle(aRecord.type + " " + aRecord.id)
        //subnode.setTitle(aRecord.id)
        subnode.setKey(aRecord.id)
        subnode.setStore(this.defaultStore()) //// <-------------------- avoid this?
        const size = JSON.stableStringify(aRecord).length
        subnode.setSubtitle(size.byteSizeDescription())
        return subnode
    }
    
}.initThisClass());