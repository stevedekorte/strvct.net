/**
 * @module library.node.SvSubnodesArray
 */

"use strict";

/**
 * A subclass of SvSortedArray which maintains a reference to the owner of the subnodes,
 * and is set to persist its items. This class is used by SvNodes to maintain their subnodes.
 *
 * @class SvSubnodesArray
 * @extends SvSortedArray
 */
(class SvSubnodesArray extends SvSortedArray {
    /**
     * Initializes prototype slots for the SvSubnodesArray.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * The owner of this SvSubnodesArray.
         * @member {Object|null} _owner
         * @private
         * @category Data
         */
        Object.defineSlot(this, "_owner", null);
    }

    /**
     * Gets the owner of this SvSubnodesArray.
     * @description Retrieves the owner object of this SvSubnodesArray.
     * @returns {Object|null} The owner object or null if not set.
     * @category Data Access
     */
    owner () {
        return this._owner;
    }

    /**
     * Sets the owner of this SvSubnodesArray.
     * @description Assigns a new owner to this SvSubnodesArray.
     * @param {Object} obj - The object to set as the owner.
     * @returns {SvSubnodesArray} The SvSubnodesArray instance.
     * @category Data Modification
     */
    setOwner (obj) {
        this._owner = obj;
        return this;
    }

    /**
     * Creates a new SvSubnodesArray from an existing array.
     * @description Ensures that any method hooks are called when populating the new array.
     * @static
     * @param {Array} oldArray - The array to create a SvSubnodesArray from.
     * @returns {SvSubnodesArray} A new SvSubnodesArray instance containing the elements from oldArray.
     * @category Creation
     */
    static from (oldArray) {
        const newArray = this.clone();
        oldArray.forEach(v => newArray.push(v)); // make sure any method hooks are called
        return newArray;
    }

    /**
     * Determines if the SvSubnodesArray should be stored.
     * @description Always returns true, indicating that SvSubnodesArray should be stored.
     * @returns {boolean} Always returns true.
     * @category Storage
     */
    shouldStore () {
        return true;
    }

    didInit () {
        super.didInit();
        assert(this.hasDoneInit());
    }

}.initThisClass());
