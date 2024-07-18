"use strict";

/*

    BMHourNode 
    
*/

(class BMHourNode extends BaseNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("value", 0);
            slot.setComment("0 to 23");
            slot.setSlotType("Number");
        }
    }

    initPrototype () {
        this.setCanDelete(false)
        this.setNodeCanInspect(false)

        this.setNodeCanEditTitle(false)
        this.setNodeCanReorderSubnodes(false)

        this.setNoteIconName("right-arrow")
    }

    setValue (v) {
        assert(Number.isInteger(v) && v > -1 && v < 23)
        this._value = v
        return this
    }

    meridiemName () {
        if (this.value() > 11) {
            return "pm"
        }
        return "am"
    }

    hourName () {
        let v = this.value() % 12
        if (v === 0) { v = 12 }
        return v + "" + this.meridiemName()
    }

    title () {
        return this.hourName()
    }

    subtitle () {
        return null
    }
    
    /*
    nodeTileLink () {
        return this
    },    
    */

    prepareToSyncToView () {
        // called after clicked
        if (!this.hasSubnodes()) {
            for (let i = 0; i < 60; i += 5) {
                const minute = BMMinuteNode.clone().setValue(i)
                this.addSubnode(minute)
            }
        }
    }
    
}.initThisClass());
