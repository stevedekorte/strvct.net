/**
 * @module library.node.fields.subclasses.date
 */

"use strict";

/**
 * @class BMMonthNode
 * @extends BaseNode
 * @classdesc Represents a month node in a date hierarchy. This class handles month-specific operations and properties.
 */
(class BMMonthNode extends BaseNode {
    
    /**
     * @description Initializes the prototype slots for the BMMonthNode.
     */
    initPrototypeSlots () {
        /**
         * @property {Number} value - The month value (1-12).
         * @description Month value starts with 1.
         */
        {
            const slot = this.newSlot("value", 1);
            slot.setComment("month value starts with 1");
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the prototype with default settings.
     */
    initPrototype () {
        this.setNoteIconName("right-arrow")

        this.setCanDelete(false)
        this.setNodeCanInspect(false)

        this.setTitle("a month")
        this.setNodeCanEditTitle(true)

        //this.setSubnodeProto(BMOptionNode)
        //this.setNodeCanReorderSubnodes(false)

        //this.setNodeViewClassName("BMOptionsNodeView")
    }

    /**
     * @description Sets the value of the month.
     * @param {Number} v - The month value to set (1-12).
     * @returns {BMMonthNode} - The current instance.
     */
    setValue (v) {
        assert(Number.isInteger(v) && v > 0 && v < 13)
        this._value = v
        return this
    }

    /**
     * @description Gets the year value from the parent node.
     * @returns {Number} The year value.
     */
    year () {
        const year = this.parentNode().value()
        return year
    }

    /**
     * @description Calculates the number of days in the current month.
     * @returns {Number} The number of days in the month.
     */
    daysThisMonth () {
        return new Date(this.year(), this.value() - 1, 0).getDate();
    }

    /**
     * @description Returns an array of month names.
     * @returns {string[]} An array of month names.
     */
    monthNames () {
        return ["January", "February", "March", "April", 
            "May", "June", "July", "August", 
            "September", "October", "November", "December"];
    }

    /**
     * @description Gets the name of the current month.
     * @returns {string} The name of the current month.
     */
    monthName () {
        return this.monthNames()[this.value()-1]
    }

    /**
     * @description Gets the title of the node, which is the month name.
     * @returns {string} The month name.
     */
    title () {
        return this.monthName()
    }

    /**
     * @description Returns the month number as a zero-padded string.
     * @returns {string} The zero-padded month number.
     */
    zeroPaddedMonthNumber () {
        let v = this.value()
        if (v < 10) { 
            v = "0" + v 
        }
        return v
    }

    /**
     * @description Gets the subtitle of the node.
     * @returns {null} Always returns null.
     */
    subtitle () {
        //return this.zeroPaddedMonthNumber()
        return null
    }
    
    /**
     * @description Used by UI tile views to browse into next column.
     * @returns {BMMonthNode} The current instance.
     */
    nodeTileLink () {
        return this
    }

    /**
     * @description Prepares the node for syncing to view by populating subnodes if necessary.
     */
    prepareToSyncToView () {
        // called after Node is selected
        if (!this.subnodeCount()) {

            for (let i = 1; i < this.daysThisMonth() + 1; i++) {
                const day = BMDayNode.clone().setValue(i)
                day.setCanDelete(false)
                this.addSubnode(day)
            }
        }
    }
    
}.initThisClass());