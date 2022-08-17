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
        {
            const slot = this.newSlot("label", "")
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.newSlot("target", null)
        }

        {
            const slot = this.newSlot("methodName", null)
        }

        {
            const slot = this.newSlot("info", null)
        }
    }

    initPrototype () {
        this.setCanDelete(true)
        this.setNodeCanInspect(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)

        this.setTitle("title")
        this.setNodeCanEditTitle(true)
        
        this.setNodeCanReorderSubnodes(true)

        //this.setNodeColumnStyles(BMViewStyles.clone())
        //this.setNodeTileStyles(BMViewStyles.clone())
        //this.setNodeUsesColumnBackgroundColor(false)

        this.setNodeCanInspect(true) 
        //this.setNoteIconName("right-arrow")
    }

    init () {
        super.init()
        this.addAction("add")
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

