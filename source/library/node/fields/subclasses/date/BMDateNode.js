"use strict"

/*

    BMDateNode
    
    

*/
        
window.BMDateNode = class BMDateNode extends BMSummaryNode {
    
    static availableAsNodePrimitive() {
        return true
    }
    
    initPrototype () {        
        this.overrideSlot("subnodes").setShouldStoreSlot(false)

        this.newSlot("year", null).setShouldStoreSlot(true).setDoesHookSetter(true).setDuplicateOp("copyValue")
        this.newSlot("month", null).setShouldStoreSlot(true).setDoesHookSetter(true).setDuplicateOp("copyValue")
        this.newSlot("day", null).setShouldStoreSlot(true).setDoesHookSetter(true).setDuplicateOp("copyValue")

        const startYearSlot = this.newSlot("startYear", 2000).setShouldStoreSlot(true).setDoesHookSetter(true)
        startYearSlot.setCanInspect(true).setSlotType("Number").setLabel("Start year")

        const yearRangeSlot =  this.newSlot("yearRange", 20).setShouldStoreSlot(true).setDoesHookSetter(true)
        yearRangeSlot.setCanInspect(true).setSlotType("Number").setLabel("Year range")
    }

    init () {
        super.init()
        
        this.setNoteIconName("right arrow")

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
        /*
        const startYear = this.startYear()
        const range = this.yearRange()

        const years = []
        for (let i = startYear; i < startYear + range; i++) {
            const year = BMYearNode.clone().setValue(i)
            year.setCanDelete(false)
            years.push(year)
        }
        //this.setSubnodes(years)
        */
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
        if (!this.hasDoneInit()) {
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

}.initThisClass()
