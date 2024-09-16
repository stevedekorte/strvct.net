"use strict";

/**
 * 
 * A subclass of SortedArray which maintains a reference to the owner of the subnodes,
 * and is set to persist its items. This class is used by BMNodes to maintain their subnodes.
 * 
 * @class SubnodesArray
 * @extends SortedArray
 */

(class SubnodesArray extends SortedArray {
    /**
     * Initializes prototype slots for the SubnodesArray.
     */
    initPrototypeSlots () {
        Object.defineSlot(this, "_owner", null);
    }

    /**
     * Gets the owner of this SubnodesArray.
     * @returns {Object|null} The owner object or null if not set.
     */
    owner () {
        return this._owner;
    }

    /**
     * Sets the owner of this SubnodesArray.
     * @param {Object} obj - The object to set as the owner.
     * @returns {SubnodesArray} The SubnodesArray instance.
     */
    setOwner (obj) {
        this._owner = obj;
        return this;
    }

    /**
     * Creates a new SubnodesArray from an existing array.
     * Ensures that any method hooks are called when populating the new array.
     * @param {Array} oldArray - The array to create a SubnodesArray from.
     * @returns {SubnodesArray} A new SubnodesArray instance containing the elements from oldArray.
     */
    static from (oldArray) {
        const newArray = this.clone();
        oldArray.forEach(v => newArray.push(v)); // make sure any method hooks are called
        return newArray;
    }

    /**
     * @returns {boolean} Always returns true, indicating that SubnodesArray should be stored.
     */
    shouldStore () {
        return true;
    }

}.initThisClass());