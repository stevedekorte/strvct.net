"use strict";

/*

    ViewableNode
 
    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Class for handling a node's connection to the user interface.
    Views can reference nodes, but nodes should not reference views. 
    Views can query nodes for info or tell them to take actions, but otherwise 
    nodes should only communicate with views via notfications.

*/

(class ViewableNode extends InspectableNode {
    
    initPrototype () {
        this.newSlot("nodeViewClassName", null)
        this.newSlot("nodeRowViewClassName", null)
        this.newSlot("nodeThumbnailUrl", null)

        {
            const slot = this.newSlot("nodeIsVertical", true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setLabel("is vertical")
            slot.setSlotType("Boolean")
            slot.setInspectorPath("Layout")
            slot.setShouldStoreSlot(true)
        }

        this.newSlot("nodeRowIsSelectable", true).setDuplicateOp("copyValue")
        this.newSlot("nodeRowsStartAtBottom", false).setDuplicateOp("copyValue")
        this.newSlot("nodeNavBorderHint", true).setDuplicateOp("copyValue")

        {
            const slot = this.newSlot("nodeMinRowHeight", 0)
            slot.setDuplicateOp("copyValue")
            slot.setShouldStoreSlot(true)
            slot.setInspectorPath("style")
        }

        {
            const slot = this.newSlot("nodeMinRowWidth", 0)
            slot.setDuplicateOp("copyValue")
            slot.setShouldStoreSlot(true)
            slot.setInspectorPath("style")
        }

        // html

        this.newSlot("acceptsFileDrop", false)

        // input hook

        this.newSlot("nodeInputFieldMethod", null)

        // column settings - TODO: auto adjust to fit?

        //this.newSlot("nodeMinWidth", 200).setDuplicateOp("copyValue") // no longer used - we calc sizes of rows instead
        
        {
            const slot = this.newSlot("nodeFillsRemainingWidth", false).setDuplicateOp("copyValue")
            slot.setSlotType("Boolean")
            slot.setLabel("fills remaining")
            slot.setCanEditInspection(false)
            slot.setCanInspect(false)
            slot.setInspectorPath("Layout")
        }

        {
            const slot = this.newSlot("nodeFillsWindow", false)
            slot.setSlotType("Boolean")
            slot.setLabel("fills window")
            slot.setCanEditInspection(true)
            slot.setCanInspect(true)
            slot.setShouldStoreSlot(true)
            slot.setInspectorPath("Layout")
        }

        this.newSlot("nodeCanEditRowHeight", false).setDuplicateOp("copyValue") // TODO: change to NavHeight
        this.newSlot("nodeCanEditColumnWidth", false).setDuplicateOp("copyValue") // TODO: change to NavWidth
                
    }

    init () {
        super.init()
    }


    nodeOrientation () {
        return this.nodeIsVertical() ? "right" : "down" 
    }

     // --- nodeViewClass and nodeRowViewClass ---
    
     nodeViewClass () {
        const name = this.nodeViewClassName()

        if (name) {
            const proto = Object.getClassNamed(name)
            if (proto) {
                return proto
            }
        }
        
	  	return this.firstAncestorClassWithPostfix("View") 
    }

    // --- nodeRowViewClass ---

    nodeRowViewClass () {  
        const name = this.nodeRowViewClassName()

        if (name) {
            const proto = Object.getClassNamed(name)
            if (proto) {
                return proto
            }
        }

	  	return this.firstAncestorClassWithPostfix("RowView")
    }

    onBrowserDropChunk (dataChunk) {
        const mimeType = dataChunk.mimeType()
        const canOpenNodes = BMNode.allSubclasses().select((aClass) => aClass.canOpenMimeType(mimeType))
        const okTypes = this.acceptedSubnodeTypes()
        const canUseNodes = canOpenNodes /// canOpenNodes.select(nodeType => okTypes.contains(nodeType))

        if (canUseNodes.length) {

            if (canUseNodes.length === 1) {
                const match = canUseNodes.first()

                const newNode = match.openMimeChunk(dataChunk)
                this.addSubnode(newNode)

                
                //if (this.acceptsAddingSubnode(match)) {
                //    this.addSubnode(match)
                //}
                
            } else {
                // TODO: add CreatorNode with those types and
                // hook to instantiate from mime data
            }
        }
    }

    // --- update / sync system ----------------------------
    
    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue)

        if (aSlot.syncsToView()) { 
            this.scheduleSyncToView()
        }
    }

    scheduleSyncToView () {
        this.didUpdateNode()
        //SyncScheduler.shared().scheduleTargetAndMethod(this, "syncToView")
        return this
    }


    // --- shelf ---
	
    /*
    shelfSubnodes () {
        return []
    }

    shelfIconName () {
	    return null
    }
	
    shelfIconUrl () {
	    return null
    }
    */
    
    prepareToSyncToView () {
        this.prepareToAccess();
    }
	
    // visibility
	
    nodeBecameVisible () {
	    return this
    }

    // -- selection requests ---

    onRequestSelectionOfDecendantNode () {
        return false // allow propogation up the parentNode line
    }

    onRequestSelectionOfNode () {
        this.tellParentNodes("onRequestSelectionOfDecendantNode", this)
        return this
    }

    onTapOfNode () {
        this.tellParentNodes("onTapOfDecendantNode", this)
        return this
    }

}.initThisClass());




