/**
 * @module library.node.nodes.base
 */

"use strict";

/**
 * @class ViewableNode
 * @extends InspectableNode
 * @classdesc Class for handling a node's connection to the user interface.
 * Views can reference nodes, but nodes should not reference views. 
 * Views can query nodes for info or tell them to take actions, but otherwise 
 * nodes should only communicate with views via notfications.
 * 
 * BMNode -> TitledNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode
 */
(class ViewableNode extends InspectableNode {
    
    initPrototypeSlots () {
        /**
         * @member {string|null} nodeViewClassName
         */
        {
            const slot = this.newSlot("nodeViewClassName", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
        }
        
        /**
         * @member {string} nodeTileClassName
         */
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
        
        /**
         * @member {string|null} nodeThumbnailUrl
         */
        {
            const slot = this.newSlot("nodeThumbnailUrl", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
        }

        /**
         * @member {boolean} nodeIsVertical
         */
        {
            const slot = this.newSlot("nodeIsVertical", true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setLabel("is vertical");
            slot.setSlotType("Boolean");
            slot.setInspectorPath("Node/Viewable/Children Layout");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {string} nodeChildrenAlignment
         */
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

        /**
         * @member {boolean} nodeTileIsSelectable
         */
        {
            const slot = this.newSlot("nodeTileIsSelectable", true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }

        /**
         * @member {boolean} nodeTilesStartAtBottom
         */
        {
            const slot = this.newSlot("nodeTilesStartAtBottom", false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }

        /**
         * @member {boolean} nodeNavBorderHint
         */
        {
            const slot = this.newSlot("nodeNavBorderHint", true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }

        /**
         * @member {number} nodeMinTileHeight
         */
        {
            const slot = this.newSlot("nodeMinTileHeight", 0);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("Number");
        }

        /**
         * @member {number} nodeMinTileWidth
         */
        {
            const slot = this.newSlot("nodeMinTileWidth", 0);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("Number");
        }

        /**
         * @member {boolean} acceptsFileDrop
         */
        {
            const slot = this.newSlot("acceptsFileDrop", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {string|null} nodeInputFieldMethod
         */
        {
            const slot = this.newSlot("nodeInputFieldMethod", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
        }

        /**
         * @member {boolean} nodeFillsRemainingWidth
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

        /**
         * @member {boolean} nodeFillsWindow
         */
        {
            const slot = this.newSlot("nodeFillsWindow", false);
            slot.setSlotType("Boolean");
            slot.setLabel("fills window");
            slot.setCanEditInspection(true);
            slot.setCanInspect(true);
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Children Layout");
        }

        /**
         * @member {boolean} nodeCanEditTileHeight
         */
        {
            const slot = this.newSlot("nodeCanEditTileHeight", false);
            slot.setDuplicateOp("copyValue"); // TODO: change to NavHeight
            slot.setSlotType("Boolean");
        }

        /**
         * @member {boolean} nodeCanEditColumnWidth
         */
        {
            const slot = this.newSlot("nodeCanEditColumnWidth", false);
            slot.setDuplicateOp("copyValue"); // TODO: change to NavWidth
            slot.setSlotType("Boolean");
        }

    }

    initPrototype () {    
    }

    /**
     * @description Finalizes the initialization of the node.
     */
    finalInit () {
        super.finalInit()
        if (this.nodeChildrenAlignment() === "Start") {
            this.setNodeChildrenAlignment("flex-start")
        }
    }

    /**
     * @description Returns the node orientation.
     * @returns {string} The node orientation.
     */
    nodeOrientation () {
        return this.nodeIsVertical() ? "right" : "down" 
    }

    /**
     * @description Returns the node view class.
     * @returns {Object} The node view class.
     */
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

    /**
     * @description Returns the node tile class.
     * @returns {Object} The node tile class.
     */
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

    /**
     * @description Handles the browser drop chunk event.
     * @param {Object} dataChunk - The data chunk object.
     */
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

    /**
     * @description Handles the slot update event.
     * @param {Object} aSlot - The updated slot.
     * @param {*} oldValue - The old value of the slot.
     * @param {*} newValue - The new value of the slot.
     */
    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue);

        if (aSlot.syncsToView()) { 
            this.scheduleSyncToView(aSlot.name());
        }
    }

    /**
     * @description Schedules a sync to view for the given slot name.
     * @param {string} slotName - The name of the slot to sync.
     * @returns {ViewableNode} The current instance.
     */
    scheduleSyncToView (slotName) {
        this.didUpdateNodeIfInitialized(this, slotName);
        return this;
    }

    /**
     * @description Prepares the node to sync to view.
     */
    prepareToSyncToView () {
        this.prepareToAccess();
    }
	
    /**
     * @description Handles the node becoming visible event.
     * @returns {ViewableNode} The current instance.
     */
    nodeBecameVisible () {
	    return this;
    }

    /**
     * @description Handles the request for selection of a descendant node.
     * @returns {boolean} Always returns false to allow propagation up the parentNode line.
     */
    onRequestSelectionOfDecendantNode () {
        return false; // allow propogation up the parentNode line
    }

    /**
     * @description Handles the request for selection of the current node.
     * @returns {ViewableNode} The current instance.
     */
    onRequestSelectionOfNode () {
        this.tellParentNodes("onRequestSelectionOfDecendantNode", this);
        return this;
    }

    /**
     * @description Handles the tap event on the node.
     * @returns {ViewableNode} The current instance.
     */
    onTapOfNode () {
        this.tellParentNodes("onTapOfDecendantNode", this);
        return this;
    }

}.initThisClass());