"use strict";

/*

    BMImageNode
    
*/

(class BMImageNode extends BMStorableNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("dataURL", null)
            slot.setShouldStoreSlot(true)
        }
    }

    initPrototype () {
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setTitle("Untitled")
        this.setSubtitle(null)
        this.setCanDelete(true)
    }

    init () {
        super.init()
        this.addActions(["add"])
    }
    
    onDidEditNode () {
        this.debugLog(" onDidEditNode")
    }
    
}.initThisClass());
