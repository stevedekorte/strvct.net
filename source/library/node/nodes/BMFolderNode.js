"use strict";

/*
    
    BMFolderNode
    
    A node that supports for adding, reordering, etc other nodes to it within the UI.
    
*/

(class BMFolderNode extends BMSummaryNode {
    
    static availableAsNodePrimitive () {
        return true
    }
    
    initPrototypeSlots () {
        // These slots are useful for implementing menus 
        {
            const slot = this.newSlot("label", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
        }

        {
            const slot = this.newSlot("methodName", null);
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("info", null);
            slot.setSlotType("Object");
        }
    }

    initPrototype () {
        this.setCanDelete(true);
        this.setNodeCanInspect(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);

        this.setTitle("title");
        this.setNodeCanEditTitle(true);
        
        this.setNodeCanReorderSubnodes(true);

        this.setNodeCanInspect(true) ;
        //this.setNoteIconName("right-arrow");
    }

    init () {
        super.init()
        this.setNodeCanAddSubnode(true)
        this.setSubnodeClasses(BMNode.primitiveNodeClasses())
    }

    title () {
        return this.label()
    }

    setTitle (aString) {
        this.setLabel(aString)
        return this
    }

    acceptedSubnodeTypes () {
        return BMCreatorNode.fieldTypes()
    }

    sendMenuAction () {
       const t = this.target()
       const m = this.methodName()

       if (t && m && t[m]) {
           t[m].apply(t, [this])
       }
    }

    onTapOfNode (aNode) {
        super.onTapOfNode()
        this.sendMenuAction()
        return this
    }

    didUpdateSlotParentNode (oldValue, newValue) {
        this.scheduleSyncToView()
    }

}.initThisClass());

