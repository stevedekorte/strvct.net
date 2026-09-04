/**
 * @module library.node.nodes.base
 */

"use strict";

/**
 * @class SvViewableNode
 * @extends SvInspectableNode
 * @classdesc Class for handling a node's connection to the user interface.
 * Views can reference nodes, but nodes should not reference views.
 * Views can query nodes for info or tell them to take actions, but otherwise
 * nodes should only communicate with views via notfications.
 *
 * SvNode -> SvTitledNode -> SvInspectableNode -> SvViewableNode -> SvStyledNode -> SvBaseNode -> StorableNode
 */
(class SvViewableNode extends SvInspectableNode {

    initPrototypeSlots () {
        /**
         * @member {string|null} nodeViewClassName
         * @category View
         */
        {
            const slot = this.newSlot("nodeViewClassName", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
        }

        /**
         * @member {string} nodeTileClassName
         * @category View
         */
        {
            const addSlot = (name, path, label, values) => {
                const slot = this.newSlot(name, "");
                slot.setInspectorPath(path);
                slot.setLabel(label);
                slot.setShouldStoreSlot(true);
                slot.setDuplicateOp("copyValue");
                slot.setSlotType("String");
                slot.setValidValues(values);
                slot.setCanInspect(true);
                slot.setInspectorPath("Node/Viewable");

                return slot;
            };
            addSlot("nodeTileClassName", "", "SvTile View Class", null).setValidValuesClosure((/*instance*/) => {
                //return SvThemeResources.shared().activeTheme().themeClassNames();
                return SvTile.allSubclasses().map(aClass => aClass.svType());
            });

            //SvThemeResources.shared().activeTheme().newThemeClassOptions()
        }

        /**
         * @member {string|null} nodeThumbnailUrl
         * @category View
         */
        {
            const slot = this.newSlot("nodeThumbnailUrl", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} nodeIsVertical
         * @category Layout
         */
        {
            const slot = this.newSlot("nodeIsVertical", true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setLabel("is vertical");
            slot.setSlotType("Boolean");
            slot.setInspectorPath("Node/Viewable/Children Layout");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        /**
         * @member {string} nodeChildrenAlignment
         * @category Layout
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
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} nodeTileIsSelectable
         * @category Interaction
         */
        {
            const slot = this.newSlot("nodeTileIsSelectable", true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} nodeTilesStartAtBottom
         * @category Layout
         */
        {
            const slot = this.newSlot("nodeTilesStartAtBottom", false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }

        /**
         * @member {boolean} nodeNavBorderHint
         * @category View
         */
        {
            const slot = this.newSlot("nodeNavBorderHint", true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        /**
         * @member {number} nodeMinTileHeight
         * @category Layout
         */
        {
            const slot = this.newSlot("nodeMinTileHeight", 0);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("Number");
            slot.setSyncsToView(true);
        }

        /**
         * @member {number} nodeMinTileWidth
         * @category Layout
         */
        {
            const slot = this.newSlot("nodeMinTileWidth", 0);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("Number");
            slot.setSyncsToView(true);
        }

        /**
         * @member {number} nodeChildrenTileWidth - the width THIS node's
         * child tiles take along a HORIZONTAL row (a tab bar, a breadcrumb),
         * as a minimum: each tile is at least this wide and still grows for a
         * long label. 0 (default) = auto-fit, each tile as wide as its own
         * content — adaptive, and the right default.
         *
         * The main-axis twin of nodeMinTileHeight, which a horizontal row
         * already reads off the PARENT for its tiles' height. Deliberately
         * NOT nodeMinTileWidth: that slot already means "the width of my
         * column when I am the column" (SvNavView reads it), and one slot
         * carrying both meanings is the trap nodeMinTileHeight fell into.
         * Ignored in vertical columns, where a tile spans its column.
         * @category Layout
         */
        {
            const slot = this.newSlot("nodeChildrenTileWidth", 0);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("Number");
            slot.setSyncsToView(true);
        }

        /**
         * @member {string|null} nodeTileSurfaceName - the name of the SURFACE
         * this node's own tile sits on, looked up in the theme. null (default)
         * = transparent, so the tile shows whatever its container paints.
         *
         * A name, never a color: the node says "notice", the theme decides what
         * that looks like in each palette, so light/dark and a theme swap need
         * no model change. Resolves to var(--sv-surface-<name>).
         *
         * This exists so varying a tile's look by node does NOT require a tile
         * subclass — a custom view class breaks the naked-objects derivation
         * (it stops following the theme and has to be maintained per context),
         * so it is the last resort, and a hint like this is the first.
         * @category Style
         */
        {
            const slot = this.newSlot("nodeTileSurfaceName", null);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
        }

        /**
         * @member {string|null} nodeContainerSurfaceName - the name of the
         * surface the CONTAINER showing this node's children sits on, looked up
         * in the theme. null (default) = transparent.
         *
         * The container's twin of nodeTileSurfaceName, and deliberately
         * separate: one names the look of this node AS A ROW in its parent's
         * list, the other the look of the panel that displays it. Collapsing
         * them into one slot is the trap nodeMinTileHeight fell into.
         *
         * Because tiles and the breadcrumb bar are transparent by default, this
         * one name colors a whole region — every tile inside inherits it by
         * simply not painting. That is how two instances of the SAME view class
         * (the app's breadcrumbs and the companion's) end up different colors
         * without a subclass of either.
         * @category Style
         */
        {
            const slot = this.newSlot("nodeContainerSurfaceName", null);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Style");
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} acceptsFileDrop
         * @category Interaction
         */
        {
            const slot = this.newSlot("acceptsFileDrop", false);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        /**
         * @member {string|null} nodeInputFieldMethod
         * @category View
         */
        {
            const slot = this.newSlot("nodeInputFieldMethod", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} nodeFillsRemainingWidth
         * @category Layout
         */
        {
            const slot = this.newSlot("nodeFillsRemainingWidth", false);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
            slot.setLabel("fills remaining");
            slot.setCanEditInspection(false);
            slot.setCanInspect(false);
            slot.setInspectorPath("Node/Viewable/Children Layout");
            slot.setSyncsToView(true);
        }

        /*
        {
            const slot = this.newSlot("nodeFillsWindow", false);
            slot.setSlotType("Boolean");
            slot.setLabel("fills window");
            slot.setCanEditInspection(true);
            slot.setCanInspect(true);
            slot.setShouldStoreSlot(true);
            slot.setInspectorPath("Node/Viewable/Children Layout");
            slot.setSyncsToView(true);
        }
            */

        /**
         * @member {boolean} nodeCanEditTileHeight
         * @category Layout
         */
        {
            const slot = this.newSlot("nodeCanEditTileHeight", false);
            slot.setDuplicateOp("copyValue"); // TODO: change to NavHeight
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} nodeCanEditColumnWidth
         * @category Layout
         */
        {
            const slot = this.newSlot("nodeCanEditColumnWidth", false);
            slot.setDuplicateOp("copyValue"); // TODO: change to NavWidth
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

    }

    initPrototype () {
    }

    /**
     * @description Finalizes the initialization of the node.
     * @category Initialization
     */
    finalInit () {
        super.finalInit();
        if (this.nodeChildrenAlignment() === "Start") {
            this.setNodeChildrenAlignment("flex-start");
        }
        // The 80px default, applied ONLY when nothing has chosen a height.
        // This used to stamp unconditionally, which silently overwrote any
        // value a class declared in initPrototype (where every other style
        // hint is declared) — the hint could only be set from a subclass's
        // own finalInit, and nobody could tell why. 0 is the slot default,
        // i.e. "nobody chose"; a deliberate -1/other value is left alone.
        if (this.nodeMinTileHeight() === 0) {
            this.setNodeMinTileHeight(80);
        }
    }

    /**
     * @description Optional breadcrumb-collapse hint. When a node returns a
     * non-null string, the breadcrumb bar replaces the WHOLE path with that
     * single title plus a back arrow (both navigate one level up) while this
     * node is the current one. Must be a method override returning a value
     * (like nodeMinTileHeight), not a stored slot.
     * @returns {String|null} The collapsed title, or null for the normal path.
     * @category Layout
     */
    nodeCollapsedBreadcrumbTitle () {
        return null;
    }

    /**
     * @description Optional reading-measure hint: a CSS length (e.g. "68ch",
     * or a var() so themes can tune it) that this node's nav column centers
     * its content within (see SvNavView.syncContentMaxWidth). Null means
     * full-width content (the default). Must be a method override returning
     * a value, not a stored slot.
     * @returns {String|null} The content max width, or null.
     * @category Layout
     */
    nodeContentMaxWidth () {
        return null;
    }

    /**
     * @description Whether this node's scroll column should show a scrollbar.
     *
     * Opt-in per node, in the nodeContentMaxWidth idiom: a method returning a value,
     * never a stored slot (see the nodeMinTileHeight landmine — a stored hint gets
     * stamped onto every node and is then impossible to take back).
     *
     * The app hides webkit scrollbars globally, which suits a column browser but not
     * a long reading surface, where a scrollable region with no scroll affordance
     * reads as a defect. A node that IS a reading surface says so here.
     * @returns {Boolean}
     * @category Layout
     */
    nodeShowsScrollbar () {
        return false;
    }

    /**
     * @description Returns the node orientation.
     * @returns {string} The node orientation.
     * @category Layout
     */
    nodeOrientation () {
        return this.nodeIsVertical() ? "right" : "down";
    }

    /**
     * @description Returns the node view class.
     * @returns {Object} The node view class.
     * @category View
     */
    nodeViewClass () {
        const name = this.nodeViewClassName();
        if (name) {
            const proto = Object.getClassNamed(name);
            if (proto) {
                return proto;
            }
            console.warn("no class found for nodeViewClassName:'" + name + "'");
        }

	  	return this.firstAncestorClassWithPostfix("View");
    }

    /**
     * @description Returns the node tile class.
     * @returns {Object} The node tile class.
     * @category View
     */
    nodeTileClass () {
        // This is used (instead of nodeViewClass) by SvTilesView to
        // get it's subnode's views. Other views (typically) use nodeViewClass.
        const name = this.nodeTileClassName();

        if (name) {
            const proto = Object.getClassNamed(name);
            if (proto) {
                return proto;
            }
            console.warn("no class found for nodeTileClassName:'" + name + "'");
        }

	  	return this.firstAncestorClassWithPostfix("Tile");
    }

    /**
     * @description Handles the browser drop chunk event.
     * @param {Object} dataChunk - The data chunk object.
     * @category Interaction
     */
    onBrowserDropChunk (dataChunk) {
        const mimeType = dataChunk.mimeType();
        const subnodeClasses = this.subnodeClasses();
        const canOpenNodes = subnodeClasses.select((aClass) => aClass.canOpenMimeType(mimeType));
        //const canOpenNodes = SvNode.allSubclasses().select((aClass) => aClass.canOpenMimeType(mimeType));
        const okTypes = this.acceptedSubnodeTypes(); // did we already check when accepting drop?
        const canUseNodes = canOpenNodes; /// canOpenNodes.select(nodeType => okTypes.contains(nodeType))

        if (canUseNodes.length) {

            //if (canUseNodes.length === 1) {
            const match = canUseNodes.first();
            const newNode = match.openMimeChunk(dataChunk);

            if (okTypes.contains(newNode.svType())) {
                this.addSubnode(newNode);
            } else {
                SvWindowErrorPanel.shared().showPanelWithInfo({ message: "Cannot add node of type: " + newNode.svType() });
            }
            //if (this.acceptsAddingSubnode(match)) {
            //    this.addSubnode(match);
            //}
            //} else {
            // TODO: add CreatorNode with those types and
            // hook to instantiate from mime data
            //}
        } else {
            console.log(this.svTypeId() + ".onBrowserDropChunk: no matching subnode class found for mime type:", mimeType);
        }
    }

    /**
     * @description Handles the slot update event.
     * @param {Object} aSlot - The updated slot.
     * @param {*} oldValue - The old value of the slot.
     * @param {*} newValue - The new value of the slot.
     * @category Event
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
     * @returns {SvViewableNode} The current instance.
     * @category View
     */
    scheduleSyncToView (slotName) {
        this.didUpdateNodeIfInitialized(this, slotName);
        return this;
    }

    /**
     * @description Prepares the node to sync to view.
     * @category View
     */
    prepareToSyncToView () {
        this.prepareToAccess();
    }

    /**
     * @description Handles the node becoming visible event.
     * @returns {SvViewableNode} The current instance.
     * @category View
     */
    nodeBecameVisible () {
	    return this;
    }

    /**
     * @description Handles the request for selection of a descendant node.
     * @returns {boolean} Always returns false to allow propagation up the parentNode line.
     * @category Interaction
     */
    onRequestSelectionOfDecendantNode () {
        return false; // allow propogation up the parentNode line
    }

    /**
     * @description Handles the request for selection of the current node.
     * @returns {SvViewableNode} The current instance.
     * @category Interaction
     */
    onRequestSelectionOfNode () {
        this.tellFirstRespondingParentNode("onRequestSelectionOfDecendantNode", this);
        return this;
    }

    /**
     * @description Handles the tap event on the node.
     * @returns {SvViewableNode} The current instance.
     * @category Interaction
     */
    onTapOfNode () {
        this.tellFirstRespondingParentNode("onTapOfDecendantNode", this);
        return this;
    }

}.initThisClass());
