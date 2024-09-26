/**
 * @module library.node.fields.subclasses.time
 * @class BMTimeNode
 * @extends BMSummaryNode
 * @classdesc BMTimeNode represents a time node in the application.
 * It handles the storage and formatting of time information.
 */

"use strict";

(class BMTimeNode extends BMSummaryNode {
    
    /**
     * @static
     * @description Indicates if this node is available as a primitive.
     * @returns {boolean} True if available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return true
    }

    /**
     * @description Initializes the prototype slots for the BMTimeNode.
     */
    initPrototypeSlots () {
        this.overrideSlot("subnodes").setShouldStoreSlot(false)

        /**
         * @member {Number} hour - The hour value of the time.
         */
        {
            const slot = this.newSlot("hour", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} minute - The minute value of the time.
         */
        {
            const slot = this.newSlot("minute", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
        }
        /**
         * @member {String} timezone - The timezone of the time.
         */
        {
            const slot = this.newSlot("timezone", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
        /**
         * @member {TimeFormatter} formatter - The formatter for the time.
         */
        {
            const slot = this.newSlot("formatter", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("TimeFormatter");
            slot.setFinalInitProto(TimeFormatter);
        }
    }

    /**
     * @description Initializes the prototype of the BMTimeNode.
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);

        this.setTitle("Time");

        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setNoteIconName("right-arrow");
    }

    /**
     * @description Checks if the time has been set.
     * @returns {boolean} True if the time has been set, false otherwise.
     */
    hasTime () {
        return !Type.isNull(this.hour())
    }

    /**
     * @description Converts the stored time to a JavaScript Date object.
     * @returns {Date|null} A Date object representing the time, or null if no time is set.
     */
    jsDate () {
        //new Date(year, month, day, hours, minutes, seconds, milliseconds)
        if (this.hasTime()) {
            const d = new Date(0, 0, 0, this.hour(), this.minute(), 0, 0, 0)
            return d
        }
        return null
    }

    /**
     * @description Formats the time as a string.
     * @returns {string} The formatted time string.
     */
    timeString () {
        if (!this.formatter()) { //tmp hack to deal with bug
            this.setFormatter(TimeFormatter.clone())
        }

        return this.formatter().setDate(this.jsDate()).formattedValue()
    }

    /**
     * @description Gets the subtitle for the node.
     * @returns {string} The formatted time string or a message if no time is selected.
     */
    subtitle () {
        if (this.hasTime()) {
            return this.timeString()
        }

        return "No time selected"
    }

    /**
     * @description Prepares the node for syncing to view.
     */
    prepareToSyncToView () {
        // called after clicked
        if (!this.hasSubnodes()) {
            this.setupHourNodes()
        }
    }

    /**
     * @description Sets up the hour nodes as subnodes.
     */
    setupHourNodes () {
        for (let i = 0; i < 23; i++) {
            const hour = BMHourNode.clone().setValue(i)
            this.addSubnode(hour)
        }
    }

    /**
     * @description Handles the tap event on a descendant node.
     * @param {Object} aNode - The node that was tapped.
     * @returns {boolean} Always returns true.
     */
    onTapOfDecendantNode (aNode) {
        if (aNode.type() === "BMMinuteNode") {
            const minuteNode = aNode
            const hourNode = minuteNode.parentNode()
            this.setHour(hourNode.value())
            this.setMinute(minuteNode.value())
            this.scheduleSyncToView()
            this.parentNode().postShouldFocusSubnode(this)
        }
        return true
    }

    /**
     * @description Creates a JSON archive of the time.
     * @returns {string|null} A string representation of the time, or null if no time is set.
     */
    jsonArchive () {
        const d = this.jsDate()
        return d ? d.toString() : null
    }

}.initThisClass());