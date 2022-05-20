"use strict";

/*

    StyledNode
 
    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    For state and behavior specific to styling of views.

*/

(class StyledNode extends ViewableNode {
    
    initPrototype () {

        // view settings

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

        // view style overrides

        this.newSlot("nodeColumnStyles", null)
        this.newSlot("nodeRowStyles", null)

        // input hook

        this.newSlot("nodeInputFieldMethod", null)

        // column settings - TODO: auto adjust to fit?

        this.newSlot("nodeMinWidth", 200).setDuplicateOp("copyValue")
        
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

        {
            const slot = this.newSlot("themeClassName", "DefaultThemeClass")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("Theme Class")
            slot.setSyncsToView(true)
            slot.setInspectorPath("Style")
        }

        this.newSlot("nodeUsesColumnBackgroundColor", true).setDuplicateOp("copyValue")
        this.newSlot("nodeCanEditRowHeight", false).setDuplicateOp("copyValue")
        this.newSlot("nodeCanEditColumnWidth", false).setDuplicateOp("copyValue")

    }

    nodeOrientation () {
        return this.nodeIsVertical() ? "right" : "down" 
    }

    

    init () {
        super.init()

        this._nodeMinWidth = 180
        
        //this.setNodeColumnStyles(this.sharedNodeColumnStyles())
        //this.setNodeRowStyles(this.sharedNodeRowStyles())

        this.setNodeColumnStyles(BMViewStyles.clone())
        //this.setNodeRowStyles(BMViewStyles.clone())


        return this
    }


    customizeNodeRowStyles () {
        if (!this.getOwnProperty("_nodeRowStyles")) {
            //const styles = BMViewStyles.shared().sharedWhiteOnBlackStyle().setIsMutable(false)
            // NOTE: We can't use the shared style because column bg colors change

            const styles = BMViewStyles.clone()
            styles.selected().setColor("white")
            styles.unselected().setColor("#aaa")
            this._nodeRowStyles = styles
        }
        return this._nodeRowStyles
    }

    sharedNodeColumnStyles () {
        if (!BMNode.hasOwnProperty("_nodeColumnStyles")) {
            const styles = BMViewStyles.clone()
            //styles.selected().setColor("white")
            //styles.unselected().setColor("#aaa")
            BMNode._nodeColumnStyles = styles
        }
        return BMNode._nodeColumnStyles
    }

    sharedNodeRowStyles () {
        if (!BMNode._nodeRowStyles) {
            const styles = BMViewStyles.clone()
            BMNode._nodeRowStyles = styles
            styles.selected().setColor("white")
            styles.unselected().setColor("#aaa")
        }
        return BMNode._nodeRowStyles
    }

    // column view style
    
    setNodeColumnBackgroundColor (c) {
	    if (this.nodeColumnStyles()) {
            this.setNodeColumnStyles(BMViewStyles.clone())
	    }
	    
        this.nodeColumnStyles().selected().setBackgroundColor(c)
        this.nodeColumnStyles().unselected().setBackgroundColor(c)
        return this
    }

    nodeColumnBackgroundColor () {
	    if (this.nodeColumnStyles()) {
		    return this.nodeColumnStyles().selected().backgroundColor()
	    }
	    return null
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


    indexOfSubnode (aSubnode) {
        return this.subnodes().indexOf(aSubnode);
    }

    subnodeIndexInParent () {
        const p = this.parentNode()
        if (p) {
            return p.indexOfSubnode(this)
        }
        return 0
    }

    nodeDepth () {
        const p = this.parentNode()
        if (p) {
            return p.nodeDepth() + 1
        }
        return 0
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




