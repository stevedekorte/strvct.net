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
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {String} key
         * @category Data
         */
        {
            const slot = this.newSlot("key", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Object} store
         * @category Data
         */
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("Object"); // TODO: add store protocol
        }
    }

    /**
     * Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setCanDelete(false); // too dangerous
    }

    /**
     * Prepares the record for first access.
     * @category Initialization
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
     * @category Data Access
     */
    record () {
        return this.store().recordForPid(this.key())
    }

    /**
     * Sets the record string.
     * @param {string} s - The record string to set.
     * @throws {Error} Always throws an error as it's not editable.
     * @category Data Modification
     */
    setRecordString (s) {
        throw new Error("not editable")
    }

    /**
     * Returns the record as a JSON string.
     * @returns {string} The record as a JSON string.
     * @category Data Access
     */
    recordString () {
        return JSON.stableStringifyWithStdOptions(this.record(), null, 2)
    }

    /**
     * Returns an array of referenced records.
     * @returns {Array} An array of referenced records.
     * @category Data Access
     */
    referencedRecords () {
        return this.referencedPidSet().map( pid => this.defaultStore().recordForPid(pid) )
    }

    /**
     * Returns the set of referenced PIDs.
     * @returns {Set} The set of referenced PIDs.
     * @category Data Access
     */
    referencedPidSet () {
        return this.defaultStore().refSetForPuuid(this.record().id)
    }

    /**
     * Creates a BMDataStoreRecord for a given record.
     * @static
     * @param {Object} aRecord - The record to create a BMDataStoreRecord for.
     * @returns {BMDataStoreRecord} The created BMDataStoreRecord.
     * @category Factory
     */
    static forRecord (aRecord) {
        const subnode = BMDataStoreRecord.clone()
        subnode.setTitle(aRecord.type + " " + aRecord.id)
        //subnode.setTitle(aRecord.id)
        subnode.setKey(aRecord.id)
        subnode.setStore(this.defaultStore()) //// <-------------------- avoid this?
        const size = JSON.stableStringifyWithStdOptions(aRecord).length
        subnode.setSubtitle(size.byteSizeDescription())
        return subnode
    }
    
}.initThisClass());