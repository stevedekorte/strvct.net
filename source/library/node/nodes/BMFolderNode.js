"use strict"

/*
    
    BMFolderNode
    
    A node that supports for adding, reordering, etc other nodes to it within the UI.
    
*/

window.BMFolderNode = class BMFolderNode extends BMSummaryNode {
    
    static availableAsNodePrimitive() {
        return true
    }
    
    initPrototype () {
        this.newSlot("label", "").setShouldStoreSlot(true)

        this.newSlot("target", null)
        this.newSlot("methodName", null)
        this.newSlot("info", null)

        this.setCanDelete(true)
        this.setNodeCanInspect(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeMinWidth(300)

        this.setTitle("title")
        this.setNodeCanEditTitle(true)
        
        this.setNodeCanReorderSubnodes(true)

        //this.setNodeColumnStyles(BMViewStyles.clone())
        //this.setNodeRowStyles(BMViewStyles.clone())
        //this.setNodeUsesColumnBackgroundColor(false)

        this.setNodeCanInspect(true) 
        //this.setNoteIconName("right arrow")
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

}.initThisClass()

