"use strict";

/**
 * 
 * A subclass of IndexedArray that maintains its subnodes in sorted order.
 * It does this by calling resort() on the array when a mutation occurs on the subnode items or the sort function changes.
 * The sort closure should return a comparison result.
 * 
 * @class SortedArray
 * @extends IndexedArray
 */
(class SortedArray extends IndexedArray {


    /**
     * Initializes the SortedArray instance.
     */
    init () {
        super.init()
        Object.defineSlot(this, "_isSorting", false)
        Object.defineSlot(this, "_sortFunc", null)
    }

    /**
     * Checks if the array has a sort function defined.
     * @returns {boolean} True if a sort function is defined, false otherwise.
     */
    doesSort () {
        return !Type.isNull(this._sortFunc)
    }

    /**
     * Sets the sort function for the array.
     * The sort function should take two arguments of type BMNode and 
     * return a negative value if the first argument is less than the second,
     * Changing the sort function will cause the array to be resorted.
     * To disable sorting, pass null as the sort function.
     * @param {Function} aFunc - The sorting function to use.
     * @returns {SortedArray} The SortedArray instance.
     */
    setSortFunc (aFunc) {
        if (this._sortFunc !== aFunc) {
            this._sortFunc = aFunc;
            if (aFunc) {
                this.resort();
            }
        }
        return this
    }

    /**
     * Gets the current sort function.
     * @returns {Function|null} The current sort function or null if not set.
     */
    sortFunc () {
        return this._sortFunc
    }

    /**
     * Calls resort method when the sort function changes.
     * @param {Function|null} oldValue - The previous sort function.
     * @param {Function|null} newValue - The new sort function.
     */
    didChangeSlotSortFunc (oldValue, newValue) {
        this.resort()
    }

    /**
     * Resorts the array using the current sort function.
     * @returns {SortedArray} The SortedArray instance.
     */
    resort () {
        if (this._sortFunc && this.length && !this._isSorting) {
            this._isSorting = true;
            this.sort(this._sortFunc);
            this._isSorting = false;
        }
        return this;
    }

    /**
     * Determines if a resort is needed based on mutation method called. 
     * These mutation methods do not require a resort: pop, shift, sort, removeAt, remove, removeAll.
     * @param {string} slotName - The name of the modified slot.
     * @returns {boolean} True if a resort is needed, false otherwise.
     */
    needsResortOnForSlot (slotName) {
        const nonOrderChangingSlots = [
            "pop", 
            "shift", 
            "sort", 
            "removeAt", 
            "remove", 
            "removeAll"
        ];
        return !nonOrderChangingSlots.contains(slotName);
    }

    /**
     * Calls resort if there is a sort function and the slot name is in the list of slots that require a resort.
     * @param {string} methodNameThatCausedMutation - The name of the method that caused the mutation.
     * @param {*} [optionalValue] - The optional value associated with the mutation.
     */
    didMutate (methodNameThatCausedMutation, optionalValue) {
        if (this._isSorting) {
            return;
        }

        super.didMutate(methodNameThatCausedMutation, optionalValue);

        if (this._sortFunc && this.needsResortOnForSlot(methodNameThatCausedMutation)) {
            this.resort();
        }
    }
    
    /**
     * Runs a self-test on the SortedArray class.
     * @returns {typeof SortedArray} The SortedArray class.
     */
    static selfTest () {
        let sa = this.clone();
        sa.setSortFunc((a, b) => { return a - b });
        sa.push(3, 1, 2);
        assert(sa.isEqual([1, 2, 3]));
        return this;
    }

}.initThisClass()); //.selfTest()
