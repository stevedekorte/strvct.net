"use strict";

/*

    BMDayNode 
    
*/

(class BMDayNode extends BaseNode {
    
    initPrototypeSlots () {
        this.newSlot("value", 1).setComment("day value starts with 1")
    }

    initPrototype () {
        this.setCanDelete(false)
        this.setNodeCanInspect(false)
        this.setTitle("a day")
        this.setNodeCanEditTitle(false)
        this.setNodeCanReorderSubnodes(false)
    }

    setValue (v) {
        assert(Number.isInteger(v) && v > 0 && v < 32)
        this._value = v
        return this
    }

    dayName () {
        const v = this.value()
        return v + v.ordinalSuffix()
    }

    title () {
        return this.dayName()
    }

    subtitle () {
        return null
    }
    
    note () {
        return null
    }
    
    nodeTileLink () {
        // used by UI tile views to browse into next column
        return null
    }
    
}.initThisClass());
