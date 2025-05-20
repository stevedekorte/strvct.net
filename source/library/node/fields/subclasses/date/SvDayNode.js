"use strict";

/**
 * @module library.node.fields.subclasses.date
 * @class SvDayNode
 * @extends BaseNode
 * @classdesc Represents a day node in a calendar or date system. It handles the representation and manipulation of a single day value.
 */
(class SvDayNode extends BaseNode {
    
    /**
     * @description Initializes the prototype slots for the SvDayNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} value - The day value, starting from 1.
         * @category Data
         */
        {
            const slot = this.newSlot("value", 1);
            slot.setComment("day value starts with 1");
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the prototype with default settings.
     * @category Initialization
     */
    initPrototype () {
        this.setCanDelete(false);
        this.setNodeCanInspect(false);
        this.setTitle("a day");
        this.setNodeCanEditTitle(false);
        this.setNodeCanReorderSubnodes(false);
    }

    /**
     * @description Sets the value of the day.
     * @param {Number} v - The day value to set.
     * @returns {SvDayNode} The instance of BMDayNode.
     * @category Data Manipulation
     */
    setValue (v) {
        assert(Number.isInteger(v) && v > 0 && v < 32);
        this._value = v;
        return this;
    }

    /**
     * @description Gets the name of the day with its ordinal suffix.
     * @returns {string} The day name with ordinal suffix.
     * @category Data Retrieval
     */
    dayName () {
        const v = this.value();
        return v + v.ordinalSuffix();
    }

    /**
     * @description Gets the title of the node, which is the day name.
     * @returns {string} The day name.
     * @category Data Retrieval
     */
    title () {
        return this.dayName();
    }

    /**
     * @description Gets the subtitle of the node.
     * @returns {null} Always returns null.
     * @category Data Retrieval
     */
    subtitle () {
        return null;
    }
    
    /**
     * @description Gets the note for the node.
     * @returns {null} Always returns null.
     * @category Data Retrieval
     */
    note () {
        return null;
    }
    
    /**
     * @description Gets the tile link for the node.
     * @returns {null} Always returns null.
     * @category UI
     */
    nodeTileLink () {
        // used by UI tile views to browse into next column
        return null;
    }
    
}.initThisClass());