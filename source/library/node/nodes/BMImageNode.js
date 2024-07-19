"use strict";

/*

    BMImageNode
    
*/

(class BMImageNode extends BMStorableNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("dataURL", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
    }

    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle("Untitled");
        this.setSubtitle(null);
        this.setCanDelete(true);
        this.setNodeCanAddSubnode(true);
    }

    
    onDidEditNode () {
        this.debugLog(" onDidEditNode")
    }

    jsonArchive () {
        debugger;
        return undefined;
    }
    
}.initThisClass());
