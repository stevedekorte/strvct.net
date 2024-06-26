"use strict";

/*

    BMMinuteNode 
    
*/

(class BMMinuteNode extends BaseNode {
    
    initPrototypeSlots () {
        this.newSlot("value", 1);
    }

    initPrototype () {
        this.setCanDelete(false);
        this.setNodeCanInspect(false);
        this.setNodeCanEditTitle(false);
        this.setNodeCanReorderSubnodes(false);
    }

    setValue (v) {
        assert(Number.isInteger(v) && v > -1 && v < 60);
        this._value = v;
        return this;
    }

    minuteName () {
        let s = this.value();
        if (s < 10) { 
            s = "0" + s;
        }
        return s;
    }

    title () {
        return this.minuteName();
    }

    subtitle () {
        return null;
    }
    
    note () {
        return null;
    }
    
    nodeTileLink () {
        // used by UI tile views to browse into next column
        return null;
    }
    
}.initThisClass());
