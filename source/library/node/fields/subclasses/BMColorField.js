"use strict";

/*

    BMColorField
    
*/

(class BMColorField extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }
    
    initPrototype () {
        {
            const slot = this.newSlot("red", null)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Number")
        }

        {
            const slot = this.newSlot("green", null)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Number")
        }

        {
            const slot = this.newSlot("blue", null)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Number")
        }

        {
            const slot = this.newSlot("alpha", null)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Number")
        }

        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setTitle("color")
        this.setSubtitle(null)
        this.setCanDelete(true)
        this.setNodeCanInspect(true) 
    }

    init () {
        super.init()
        this.addActions(["add"])
    }

    asCssColor () {
        return CssColor.clone().set(this.red(), this.green(), this.blue(), this.alpha())
    }

    fromCssColor (aCssColor) {
        return this
    }
    
}.initThisClass());
