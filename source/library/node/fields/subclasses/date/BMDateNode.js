"use strict";

/*

    BMDateNode
    
    

*/
        
(class BMDateNode extends BMSummaryNode {
    
    static availableAsNodePrimitive () {
        return true
    }
    
    initPrototypeSlots () {        

        {
            const slot = this.overrideSlot("subnodes")
            slot.setShouldStoreSlot(false)
        }

        {
            const slot = this.newSlot("year", null)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
            slot.setDuplicateOp("copyValue")
        }

        {
            const slot = this.newSlot("month", null)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
            slot.setDuplicateOp("copyValue")
        }

        {
            const slot = this.newSlot("day", null)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
            slot.setDuplicateOp("copyValue")
        }

        {
            const slot = this.newSlot("startYear", 2000)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
            slot.setCanInspect(true)
            slot.setSlotType("Number")
            slot.setLabel("Start year")
        }

        {
            const slot = this.newSlot("yearRange", 20)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
            slot.setCanInspect(true)
            slot.setSlotType("Number")
            slot.setLabel("Year range")
        }
    }

    init () {
        super.init()
        
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

    hasDate () {
        return !Type.isNull(this.year())
    }

    jsDate () {
        //new Date(year, month, day, hours, minutes, seconds, milliseconds)
        if (this.hasDate()) {
            const d = new Date(this.year(), this.month(), this.day(), 0, 0, 0, 0, 0)
            //console.log("d = ", d)
            return d
        }
        return null
    }

    subtitle () {
        if (this.hasDate()) {
            const d = this.jsDate()
            const s = d.monthName() + " " + d.dateNumberName() + ", " + d.getFullYear()
            const s2 = [this.year(), this.month(), this.day()].join("-")
            return s2 //+ " - " + s
            return s
        }

        return "No date selected"
    }

    prepareToSyncToView () {
        // called after DateNode is selected
        if (!this.hasSubnodes()) {
            this.setupSubnodes()
        }
    }

    setupSubnodes () {
        this.removeAllSubnodes()
        
        const startYear = this.startYear()
        const range = this.yearRange()

        const years = []
        for (let i = startYear; i < startYear + range; i++) {
            const year = BMYearNode.clone().setValue(i)
            year.setCanDelete(false)
            years.push(year)
        }
        this.setSubnodes(years)
    }

    onTapOfDecendantNode (aNode) {
        if (aNode.type() === "BMDayNode") {
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

    endYear () {
        return this.startYear() + this.yearRange()
    }

    yearRangeOk () {
        return this.startYear() <= this.endYear()
    }

    didUpdateSlotStartYear () {
        if (!this.hasDoneInit()) { // so we ignore the initial setup as a change
            return
        }

        if (!this.yearRangeOk()) {
            this.setEndYear(this.startYear())
        }
        this.setupSubnodes()
    }

    didUpdateSlotEndYear () {
        if (!this.hasDoneInit()) {
            return
        }

        if (!this.yearRangeOk()) {
            this.setStartYear(this.endYear())
        }
        this.setupSubnodes()
    }

    jsonArchive () {
        const d = this.jsDate()
        return d ? d.toString() : null
    }

}.initThisClass());
