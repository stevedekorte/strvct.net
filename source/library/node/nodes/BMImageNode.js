"use strict";

/*

    BMImageNode
    
*/

(class BMImageNode extends BMStorableNode {
    
    initPrototype () {
        this.newSlot("dataURL", null).setShouldStoreSlot(true)

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
        this.scheduleSyncToStore()
    }
    
}.initThisClass());
