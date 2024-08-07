"use strict";

/*

    BMTimeNode
    
    

*/
        
(class BMTimeNode extends BMSummaryNode {
      
    static availableAsNodePrimitive () {
        return true
    }

    initPrototypeSlots () {
        this.overrideSlot("subnodes").setShouldStoreSlot(false)

        {
            const slot = this.newSlot("hour", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("minute", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("timezone", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("formatter", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("TimeFormatter");
            slot.setFinalInitProto(TimeFormatter);
        }
    }

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

    hasTime () {
        return !Type.isNull(this.hour())
    }

    jsDate () {
        //new Date(year, month, day, hours, minutes, seconds, milliseconds)
        if (this.hasTime()) {
            const d = new Date(0, 0, 0, this.hour(), this.minute(), 0, 0, 0)
            return d
        }
        return null
    }

    timeString () {
        if (!this.formatter()) { //tmp hack to deal with bug
            this.setFormatter(TimeFormatter.clone())
        }

        return this.formatter().setDate(this.jsDate()).formattedValue()
    }

    subtitle () {
        if (this.hasTime()) {
            return this.timeString()
        }

        return "No time selected"
    }

    prepareToSyncToView () {
        // called after clicked
        if (!this.hasSubnodes()) {
            this.setupHourNodes()
        }
    }

    setupHourNodes () {
        for (let i = 0; i < 23; i++) {
            const hour = BMHourNode.clone().setValue(i)
            this.addSubnode(hour)
        }
    }

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

    jsonArchive () {
        const d = this.jsDate()
        return d ? d.toString() : null
    }

}.initThisClass());
