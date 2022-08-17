"use strict";

/*
    
    BMTextNode
    
    A node that contains Text, stores it's:
        content, color, font, padding, margin
    and has an inspector for these attributes
    
*/

(class BMTextNode extends BMStorableNode {
    static availableAsNodePrimitive () {
        return true
    }

    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("nodeUrlLink", "")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("URL")
            //slot.setSyncsToView(true)
            //slot.setInspectorPath("Style")
        }
        */

        {
            const slot = this.newSlot("value", "...")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("value")
            slot.setSyncsToView(true)
            //slot.setInspectorPath("Style")
        }
    }

    initPrototype () {
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setCanDelete(true)
        this.setNodeCanInspect(true)

        this.setTitle("title")
        this.setNodeCanEditTitle(true)
        
        this.setNodeCanReorderSubnodes(true)
  
        this.setNodeCanEditTileHeight(true)
        this.setNodeCanEditColumnWidth(true)
    }

    /*
    init () {
        super.init()
    }
    */

    acceptedSubnodeTypes () {
        return []
    }

}.initThisClass());

