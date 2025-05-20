/**
 * @module library.node.fields.subclasses.time
 * @class SvHourNode
 * @extends BaseNode
 * @classdesc Represents an hour node in a time-related structure. Handles hours from 0 to 23.
 */
"use strict";

(class SvHourNode extends BaseNode {
    
    /**
     * Initializes the prototype slots for the SvHourNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} value - The hour value, ranging from 0 to 23.
         * @category Data
         */
        {
            const slot = this.newSlot("value", 0);
            slot.setComment("0 to 23");
            slot.setSlotType("Number");
        }
    }

    /**
     * Initializes the prototype with default settings.
     * @category Initialization
     */
    initPrototype () {
        this.setCanDelete(false)
        this.setNodeCanInspect(false)

        this.setNodeCanEditTitle(false)
        this.setNodeCanReorderSubnodes(false)

        this.setNoteIconName("right-arrow")
    }

    /**
     * Sets the value of the hour.
     * @param {Number} v - The hour value to set (0-23).
     * @returns {SvHourNode} The instance for method chaining.
     * @category Data
     */
    setValue (v) {
        assert(Number.isInteger(v) && v > -1 && v < 23)
        this._value = v
        return this
    }

    /**
     * Returns the meridiem name (am/pm) based on the current hour value.
     * @returns {string} "am" or "pm"
     * @category Time Conversion
     */
    meridiemName () {
        if (this.value() > 11) {
            return "pm"
        }
        return "am"
    }

    /**
     * Returns the hour name in 12-hour format with meridiem.
     * @returns {string} The hour name (e.g., "12pm", "3am")
     * @category Time Conversion
     */
    hourName () {
        let v = this.value() % 12
        if (v === 0) { v = 12 }
        return v + "" + this.meridiemName()
    }

    /**
     * Returns the title of the node, which is the hour name.
     * @returns {string} The hour name
     * @category Display
     */
    title () {
        return this.hourName()
    }

    /**
     * Returns the subtitle of the node.
     * @returns {null} Always returns null
     * @category Display
     */
    subtitle () {
        return null
    }
    
    /*
    nodeTileLink () {
        return this
    },    
    */

    /**
     * Prepares the node for syncing to view by adding minute subnodes if not present.
     * @category View Synchronization
     */
    prepareToSyncToView () {
        // called after clicked
        if (!this.hasSubnodes()) {
            for (let i = 0; i < 60; i += 5) {
                const minute = SvMinuteNode.clone().setValue(i)
                this.addSubnode(minute)
            }
        }
    }
    
}.initThisClass());