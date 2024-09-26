"use strict";

/**
 * @module library.node.fields.subclasses.time
 * @class BMMinuteNode
 * @extends BaseNode
 * @classdesc Represents a minute node in a time-related structure.
 */
(class BMMinuteNode extends BaseNode {
    
    /**
     * Initializes the prototype slots for the BMMinuteNode.
     */
    initPrototypeSlots () {
        {
            /**
             * @member {Number} value - The minute value.
             */
            const slot = this.newSlot("value", 1);
            slot.setSlotType("Number");
        }
    }

    /**
     * Initializes the prototype of the BMMinuteNode.
     */
    initPrototype () {
        this.setCanDelete(false);
        this.setNodeCanInspect(false);
        this.setNodeCanEditTitle(false);
        this.setNodeCanReorderSubnodes(false);
    }

    /**
     * Sets the value of the minute.
     * @param {Number} v - The minute value to set.
     * @returns {BMMinuteNode} The instance of BMMinuteNode.
     */
    setValue (v) {
        assert(Number.isInteger(v) && v > -1 && v < 60);
        this._value = v;
        return this;
    }

    /**
     * Returns the formatted minute name.
     * @returns {string} The formatted minute name.
     */
    minuteName () {
        let s = this.value();
        if (s < 10) { 
            s = "0" + s;
        }
        return s;
    }

    /**
     * Returns the title of the node.
     * @returns {string} The title of the node.
     */
    title () {
        return this.minuteName();
    }

    /**
     * Returns the subtitle of the node.
     * @returns {null} Always returns null.
     */
    subtitle () {
        return null;
    }
    
    /**
     * Returns the note of the node.
     * @returns {null} Always returns null.
     */
    note () {
        return null;
    }
    
    /**
     * Returns the node tile link.
     * @description Used by UI tile views to browse into next column.
     * @returns {null} Always returns null.
     */
    nodeTileLink () {
        return null;
    }
    
}.initThisClass());