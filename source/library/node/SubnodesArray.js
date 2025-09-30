/**
 * @module library.node.SubnodesArray
 */

"use strict";

/**
 * A subclass of SortedArray which maintains a reference to the owner of the subnodes,
 * and is set to persist its items. This class is used by SvNodes to maintain their subnodes.
 *
 * @class SubnodesArray
 * @extends SortedArray
 */
(class SubnodesArray extends SortedArray {
    /**
     * Initializes prototype slots for the SubnodesArray.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * The owner of this SubnodesArray.
         * @member {Object|null} _owner
         * @private
         * @category Data
         */
        Object.defineSlot(this, "_owner", null);
    }

    /**
     * Gets the owner of this SubnodesArray.
     * @description Retrieves the owner object of this SubnodesArray.
     * @returns {Object|null} The owner object or null if not set.
     * @category Data Access
     */
    owner () {
        return this._owner;
    }

    /**
     * Sets the owner of this SubnodesArray.
     * @description Assigns a new owner to this SubnodesArray.
     * @param {Object} obj - The object to set as the owner.
     * @returns {SubnodesArray} The SubnodesArray instance.
     * @category Data Modification
     */
    setOwner (obj) {
        this._owner = obj;
        return this;
    }

    /**
     * Creates a new SubnodesArray from an existing array.
     * @description Ensures that any method hooks are called when populating the new array.
     * @static
     * @param {Array} oldArray - The array to create a SubnodesArray from.
     * @returns {SubnodesArray} A new SubnodesArray instance containing the elements from oldArray.
     * @category Creation
     */
    static from (oldArray) {
        const newArray = this.clone();
        oldArray.forEach(v => newArray.push(v)); // make sure any method hooks are called
        return newArray;
    }

    /**
     * Determines if the SubnodesArray should be stored.
     * @description Always returns true, indicating that SubnodesArray should be stored.
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
