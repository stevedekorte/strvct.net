"use strict";

/*

    ViewableNode
 
    BMNode -> TitledNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Class for handling a node's connection to the user interface.
    Views can reference nodes, but nodes should not reference views. 
    Views can query nodes for info or tell them to take actions, but otherwise 
    nodes should only communicate with views via notfications.

*/

(class ViewableNode extends InspectableNode {
    
    initPrototypeSlots () {

        {
            const slot = this.newSlot("nodeViewClassName", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
        }
        
    
        {
            const addSlot = (name, path, label, values) => {
                const slot = this.newSlot(name, "")
                slot.setInspectorPath(path)
                slot.setLabel(label)
                slot.setShouldStoreSlot(true)
                slot.setDuplicateOp("copyValue")
                slot.setSlotType("String")
                slot.setValidValues(values)
                slot.setCanInspect(true)
                slot.setInspectorPath("Node/Viewable")

                return slot
            }
            addSlot("nodeTileClassName", "", "Tile View Class", null).setValidValuesClosure((instance) => { 
                //return BMThemeResources.shared().activeTheme().themeClassNames()
                return Tile.allSubclasses().map(aClass => aClass.type())
            })

            //BMThemeResources.shared().activeTheme().newThemeClassOptions()
        }
        

        /*
        {
            const slot = this.newSlot("nodeTileClassName", null)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setLabel("Tile Class Name")
            slot.setSlotType("String")
            slot.setShouldStoreSlot(true)
        }
        */

        {
            const slot = this.newSlot("nodeThumbnailUrl", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("nodeIsVertical", true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setLabel("is vertical");
            slot.setSlotType("Boolean");
            slot.setInspectorPath("Node/Viewable/Children Layout");
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("nodeChildrenAlignment", "flex-start");
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setLabel("alignment");
            slot.setSlotType("String");
            slot.setValidValues(["flex-start", "center", "flex-end", "space-between", "space-around"]);
            slot.setInspectorPath("Node/Viewable/Children Layout");
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("nodeTileIsSelectable", true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("nodeTilesStartAtBottom", false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("nodeNavBorderHint", true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("nodeMinTileHeight", 0);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("Number");
        }

        {
            const slot = this.newSlot("nodeMinTileWidth", 0);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("Number");
        }

        // html

        {
            const slot = this.newSlot("acceptsFileDrop", false);
            slot.setSlotType("Boolean");
        }

        // input hook

        {
            const slot = this.newSlot("nodeInputFieldMethod", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
        }

        // column settings - TODO: auto adjust to fit?

        /*
        {
            const slot = this.newSlot("nodeMinWidth", 200).setDuplicateOp("copyValue") // no longer used - we calc sizes of tiles instead
        }
        */
        
        {
            const slot = this.newSlot("nodeFillsRemainingWidth", false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
            slot.setLabel("fills remaining");
            slot.setCanEditInspection(false);
            slot.setCanInspect(false);
            slot.setInspectorPath("Node/Viewable/Children Layout");
        }

        {
            const slot = this.newSlot("nodeFillsWindow", false);
            slot.setSlotType("Boolean");
            slot.setLabel("fills window");
            slot.setCanEditInspection(true);
            slot.setCanInspect(true);
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Children Layout");
        }

        {
            const slot = this.newSlot("nodeCanEditTileHeight", false);
            slot.setDuplicateOp("copyValue"); // TODO: change to NavHeight
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("nodeCanEditColumnWidth", false);
            slot.setDuplicateOp("copyValue"); // TODO: change to NavWidth
            slot.setSlotType("Boolean");
        }

    }

    initPrototype () {    
    }


    finalInit () {
        super.finalInit()
        if (this.nodeChildrenAlignment() === "Start") {
            this.setNodeChildrenAlignment("flex-start")
        }
    }

    nodeOrientation () {
        return this.nodeIsVertical() ? "right" : "down" 
    }

     // --- nodeViewClass and nodeTileClass ---
    
     nodeViewClass () {
        const name = this.nodeViewClassName()
        if (name) {
            const proto = Object.getClassNamed(name)
            if (proto) {
                return proto
            }
            console.warn("no class found for nodeViewClassName:'" + name + "'")
            debugger 
        }
        
	  	return this.firstAncestorClassWithPostfix("View") 
    }

    // --- nodeTileClass ---

    nodeTileClass () {  
        // This is used (instead of nodeViewClass) by TilesView to 
        // get it's subnode's views. Other views (typically) use nodeViewClass.
        const name = this.nodeTileClassName()

        if (name) {
            const proto = Object.getClassNamed(name)
            if (proto) {
                return proto
            }
            console.warn("no class found for nodeTileClassName:'" + name + "'");
        }

	  	return this.firstAncestorClassWithPostfix("Tile");
    }

    onBrowserDropChunk (dataChunk) {
        const mimeType = dataChunk.mimeType();
        const canOpenNodes = BMNode.allSubclasses().select((aClass) => aClass.canOpenMimeType(mimeType));
        const okTypes = this.acceptedSubnodeTypes();
        const canUseNodes = canOpenNodes; /// canOpenNodes.select(nodeType => okTypes.contains(nodeType))

        if (canUseNodes.length) {

            if (canUseNodes.length === 1) {
                const match = canUseNodes.first();
                const newNode = match.openMimeChunk(dataChunk);
                this.addSubnode(newNode);

                //if (this.acceptsAddingSubnode(match)) {
                //    this.addSubnode(match);
                //}
                
            } else {
                // TODO: add CreatorNode with those types and
                // hook to instantiate from mime data
            }
        }
    }

    // --- update / sync system ----------------------------
    
    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue);

        if (aSlot.syncsToView()) { 
            this.scheduleSyncToView(aSlot.name());
        }
    }

    scheduleSyncToView (slotName) {
        this.didUpdateNodeIfInitialized(this, slotName);
        return this;
    }


    // --- shelf ---
	
    /*
    shelfSubnodes () {
        return [];
    }

    shelfIconName () {
	    return null;
    }
	
    shelfIconUrl () {
	    return null;
    }
    */
    
    prepareToSyncToView () {
        this.prepareToAccess();
    }
	
    // visibility
	
    nodeBecameVisible () {
	    return this;
    }

    // -- selection requests ---

    onRequestSelectionOfDecendantNode () {
        return false; // allow propogation up the parentNode line
    }

    onRequestSelectionOfNode () {
        this.tellParentNodes("onRequestSelectionOfDecendantNode", this);
        return this;
    }

    onTapOfNode () {
        this.tellParentNodes("onTapOfDecendantNode", this);
        return this;
    }

}.initThisClass());




