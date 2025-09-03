"use strict";

/**
 * @module library.node.fields.subclasses.date
 * @class SvDateNode
 * @extends SvSummaryNode
 * @classdesc SvDateNode represents a date field in the application. It provides functionality to select and display dates.
 */
(class SvDateNode extends SvSummaryNode {
    
    /**
     * @static
     * @returns {boolean} True if this node is available as a primitive.
     * @category Utility
     */
    static availableAsNodePrimitive () {
        return true;
    }
    
    /**
     * @description Initializes the prototype slots for the SvDateNode.
     * @category Initialization
     */
    initPrototypeSlots () {        

        /**
         * @member {Array} subnodes
         * @category Data
         */
        {
            const slot = this.overrideSlot("subnodes");
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Array");
        }

        /**
         * @member {Number} year
         * @category Data
         */
        {
            const slot = this.newSlot("year", null);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} month
         * @category Data
         */
        {
            const slot = this.newSlot("month", null);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} day
         * @category Data
         */
        {
            const slot = this.newSlot("day", null);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} startYear
         * @category Configuration
         */
        {
            const slot = this.newSlot("startYear", 2000);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setCanInspect(true);
            slot.setSlotType("Number");
            slot.setLabel("Start year");
        }

        /**
         * @member {Number} yearRange
         * @category Configuration
         */
        {
            const slot = this.newSlot("yearRange", 20);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setCanInspect(true);
            slot.setSlotType("Number");
            slot.setLabel("Year range");
        }
    }

    /**
     * @description Initializes the prototype of the SvDateNode.
     * @category Initialization
     */
    initPrototype () {
        
        this.setNoteIconName("right-arrow")

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(false)
        this.setCanDelete(true)

        this.setTitle("Date")
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setNodeCanInspect(true)
    }

    /**
     * @description Checks if a date has been set.
     * @returns {boolean} True if a date has been set, false otherwise.
     * @category Utility
     */
    hasDate () {
        return !Type.isNull(this.year())
    }

    /**
     * @description Creates a JavaScript Date object from the stored date.
     * @returns {Date|null} A Date object if a date has been set, null otherwise.
     * @category Utility
     */
    jsDate () {
        //new Date(year, month, day, hours, minutes, seconds, milliseconds)
        if (this.hasDate()) {
            const d = new Date(this.year(), this.month(), this.day(), 0, 0, 0, 0, 0)
            //this.log("d = ", d)
            return d
        }
        return null
    }

    /**
     * @description Generates a subtitle for the node.
     * @returns {string} A string representation of the date or "No date selected".
     * @category Display
     */
    subtitle () {
        if (this.hasDate()) {
            const d = this.jsDate()
            const s = d.monthName() + " " + d.dateNumberName() + ", " + d.getFullYear()
            const s2 = [this.year(), this.month(), this.day()].join("-")
            return s2 + " - " + s;
        }

        return "No date selected"
    }

    /**
     * @description Prepares the node for syncing to view.
     * @category View
     */
    prepareToSyncToView () {
        // called after DateNode is selected
        if (!this.hasSubnodes()) {
            this.setupSubnodes()
        }
    }

    /**
     * @description Sets up the subnodes for year selection.
     * @category Initialization
     */
    setupSubnodes () {
        this.removeAllSubnodes()
        
        const startYear = this.startYear()
        const range = this.yearRange()

        const years = []
        for (let i = startYear; i < startYear + range; i++) {
            const year = SvYearNode.clone().setValue(i)
            year.setCanDelete(false)
            years.push(year)
        }
        this.setSubnodes(years)
    }

    /**
     * @description Handles tap events on descendant nodes.
     * @param {Object} aNode - The tapped node.
     * @returns {boolean} Always returns true.
     * @category Event
     */
    onTapOfDecendantNode (aNode) {
        if (aNode.type() === "SvDayNode") {
            const dayNode = aNode
            const monthNode = dayNode.parentNode()
            const yearNode = monthNode.parentNode()
            this.setDay(dayNode.value())
            this.setMonth(monthNode.value())
            this.setYear(yearNode.value())
            this.scheduleSyncToView()
            this.parentNode().postShouldFocusSubnode(this)
        }
        return true
    }

    /**
     * @description Calculates the end year based on start year and range.
     * @returns {number} The end year.
     * @category Utility
     */
    endYear () {
        return this.startYear() + this.yearRange()
    }

    /**
     * @description Checks if the year range is valid.
     * @returns {boolean} True if the year range is valid, false otherwise.
     * @category Validation
     */
    yearRangeOk () {
        return this.startYear() <= this.endYear()
    }

    /**
     * @description Handles updates to the startYear slot.
     * @category Event
     */
    didUpdateSlotStartYear () {
        if (!this.hasDoneInit()) { // so we ignore the initial setup as a change
            return
        }

        if (!this.yearRangeOk()) {
            this.setEndYear(this.startYear())
        }
        this.setupSubnodes()
    }

    /**
     * @description Handles updates to the endYear slot.
     * @category Event
     */
    didUpdateSlotEndYear () {
        if (!this.hasDoneInit()) {
            return
        }

        if (!this.yearRangeOk()) {
            this.setStartYear(this.endYear())
        }
        this.setupSubnodes()
    }

    /**
     * @description Creates a JSON archive of the date.
     * @returns {string|null} A string representation of the date or null if no date is set.
     * @category Serialization
     */
    jsonArchive () {
        const d = this.jsDate()
        return d ? d.toString() : null
    }

}.initThisClass());