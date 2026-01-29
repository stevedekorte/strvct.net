/** * @module library.node.fields.subclasses.time
 */

/** * @class SvTimeNode
 * @extends SvSummaryNode
 * @classdesc SvTimeNode represents a time node in the application.
 * It handles the storage and formatting of time information.


 */

/**

 */

"use strict";

(class SvTimeNode extends SvSummaryNode {

    /**
     * @static
     * @description Indicates if this node is available as a primitive.
     * @returns {boolean} True if available as a node primitive.
     * @category Metadata
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @description Initializes the prototype slots for the SvTimeNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        this.overrideSlot("subnodes").setShouldStoreSlot(false);

        /**
         * @member {Number} hour - The hour value of the time.
         * @category Time
         */
        {
            const slot = this.newSlot("hour", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} minute - The minute value of the time.
         * @category Time
         */
        {
            const slot = this.newSlot("minute", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
        }
        /**
         * @member {String} timezone - The timezone of the time.
         * @category Time
         */
        {
            const slot = this.newSlot("timezone", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
        /**
         * @member {TimeFormatter} formatter - The formatter for the time.
         * @category Formatting
         */
        {
            const slot = this.newSlot("formatter", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("TimeFormatter");
            slot.setFinalInitProto(TimeFormatter);
        }
    }

    /**
     * @description Initializes the prototype of the SvTimeNode.
     * @category Initialization
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
     * @category Time
     */
    hasTime () {
        return !Type.isNull(this.hour());
    }

    /**
     * @description Converts the stored time to a JavaScript Date object.
     * @returns {Date|null} A Date object representing the time, or null if no time is set.
     * @category Time
     */
    jsDate () {
        //new Date(year, month, day, hours, minutes, seconds, milliseconds)
        if (this.hasTime()) {
            const d = new Date(0, 0, 0, this.hour(), this.minute(), 0, 0, 0);
            return d;
        }
        return null;
    }

    setJsDate (d) {
        this.setHour(d.getHours());
        this.setMinute(d.getMinutes());
        return this;
    }

    /**
     * @description Formats the time as a string.
     * @returns {string} The formatted time string.
     * @category Formatting
     */
    timeString () {
        if (!this.formatter()) { //tmp hack to deal with bug
            this.setFormatter(TimeFormatter.clone());
        }

        return this.formatter().setDate(this.jsDate()).formattedValue();
    }

    /**
     * @description Gets the subtitle for the node.
     * @returns {string} The formatted time string or a message if no time is selected.
     * @category Display
     */
    subtitle () {
        if (this.hasTime()) {
            return this.timeString();
        }

        return "No time selected";
    }

    /**
     * @description Prepares the node for syncing to view.
     * @category View
     */
    prepareToSyncToView () {
        // called after clicked
        if (!this.hasSubnodes()) {
            this.setupHourNodes();
        }
    }

    /**
     * @description Sets up the hour nodes as subnodes.
     * @category Initialization
     */
    setupHourNodes () {
        for (let i = 0; i < 23; i++) {
            const hour = SvHourNode.clone().setValue(i);
            this.addSubnode(hour);
        }
    }

    /**
     * @description Handles the tap event on a descendant node.
     * @param {Object} aNode - The node that was tapped.
     * @returns {boolean} Always returns true.
     * @category Event
     */
    onTapOfDecendantNode (aNode) {
        if (aNode.svType() === "SvMinuteNode") {
            const minuteNode = aNode;
            const hourNode = minuteNode.parentNode();
            this.setHour(hourNode.value());
            this.setMinute(minuteNode.value());
            this.scheduleSyncToView();
            this.parentNode().postShouldFocusSubnode(this);
        }
        return true;
    }

    serializeToJson (/*filterName, pathComponents = []*/) {
        const json = {
            hour: this.hour(),
            minute: this.minute(),
            timezone: this.timezone(),
        };
        return json;
    }

    deserializeFromJson (json, filterName, pathComponents = []) {
        assert(Type.isNumber(json.hour), (() => { return "Expected number for JSON path: " + pathComponents.concat("hour").join("/"); }));
        assert(Type.isNumber(json.minute), (() => { return "Expected number for JSON path: " + pathComponents.concat("minute").join("/"); }));
        assert(Type.isString(json.timezone), (() => { return "Expected string for JSON path: " + pathComponents.concat("timezone").join("/"); }));
        this.setHour(json.hour);
        this.setMinute(json.minute);
        this.setTimezone(json.timezone);
        return this;
    }

}.initThisClass());
