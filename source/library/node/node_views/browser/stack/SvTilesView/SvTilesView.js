"use strict";

/** * @module library.node.node_views.browser.stack.SvTilesView
 */

/** * @class SvTilesView
 * @extends SvScrollContentView
 * @classdesc Contains array of SvTile (and SvTile decendant class) views.
 * Parent is a SvStackScrollView, whose parent is a SvNavView.


 */

/**

 */
(class SvTilesView extends SvScrollContentView {

    initPrototypeSlots () {
        /**
         * @member {Array} tiles
         * @category Data
         */
        {
            const slot = this.newSlot("tiles", null);
            slot.setSlotType("Array");
        }
        /**
         * @member {Boolean} allowsCursorNavigation
         * @category Navigation
         */
        {
            const slot = this.newSlot("allowsCursorNavigation", true);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {SvTile} tilePlaceHolder
         * @category UI
         */
        {
            const slot = this.newSlot("tilePlaceHolder", null);
            slot.setSlotType("SvTile");
        }
        /**
         * @member {Boolean} hasPausedSync
         * @category State
         */
        {
            const slot = this.newSlot("hasPausedSync", false);
            slot.setSlotType("Boolean");
        }
        /*
        {
            const slot = this.newSlot("isColumnInspecting", false);
            slot.setSlotType("Boolean");
        }
        */
    }

    initPrototype () {
    }

    /**
     * @description Initializes the SvTilesView
     * @returns {SvTilesView}
     * @category Initialization
     */
    init () {
        super.init();
        //this.setDisplay("block"); // if block is used, there with be gaps between rows despite 0 margins!
        this.setDisplay("flex");


        this.setPosition("relative");
        //this.setFlexBasis("fit-content");
        //this.setFlexGrow(0);
        //this.setFlexShrink(0);
        this.makeOrientationRight();

        this.setOverflow("hidden");
        this.setOverflowScrolling("auto");

        this.setMsOverflowStyle("none");
        this.setUserSelect("none");

        /*
        this.setMinAndMaxWidth("fit-content")
        this.setMinAndMaxHeight("fit-content")
        */
        //this.setBorder("3px solid blue")

        this.setIsDebugging(false);
        this.setIsRegisteredForKeyboard(true);
        this.setAcceptsFirstResponder(true);

        this.setUserSelect("none");
        this.addGestureRecognizer(SvPinchGestureRecognizer.clone()); // for pinch open to add tile
        this.addGestureRecognizer(SvTapGestureRecognizer.clone()); // for pinch open to add tile

        this.setIsRegisteredForBrowserDrop(true);

        //this.setBorder("1px dashed red");
        this.setDefaultSubviewProto(SvTitledTile);

        // Accessibility: list container role
        this.setAttribute("role", "list");

        return this;
    }

    // --- helpers ---
    // subview path: SvStackView -> SvNavView -> SvScrollView -> SvTilesView -> Tiles

    /**
     * @description Gets the SvNavView
     * @returns {SvNavView|null}
     * @category Navigation
     */
    navView () {
        const sv = this.scrollView();
        if (!sv) {
            return null;
        }
        return sv.parentView();
    }

    /**
     * @description Gets the SvStackView
     * @returns {SvStackView|null}
     * @category Navigation
     */
    stackView () {
        const nv = this.navView();
        if (!nv) {
            return null;
        }
        return nv.parentView();
    }

    /*
    browser () {
        return this.stackView();
    }
    */

    // --- title ---

    /**
     * @description Gets the title
     * @returns {string}
     * @category UI
     */
    title () {
        return this.node() ? this.node().title() : "";
    }

    // --- accessing tiles ---

    /**
     * @description Gets the tiles
     * @returns {Array}
     * @category Data
     */
    tiles () {
        return this.subviews();
    }

    /**
     * @description Adds a tile
     * @param {SvTile} v - The tile to add
     * @returns {SvTile}
     * @category Data
     */
    addTile (v) {
        return this.addSubview(v);
    }

    /**
     * @description Removes a tile
     * @param {SvTile} v - The tile to remove
     * @returns {SvTile}
     * @category Data
     */
    removeTile (v) {
        return this.removeSubview(v);
    }

    /**
     * @description Gets tiles with nodes
     * @param {Array} nodeArray - Array of nodes
     * @returns {Array}
     * @category Data
     */
    tilesWithNodes (nodeArray) {
        return nodeArray.map(node => this.tileWithNode(node));
    }

    /**
     * @description Gets tile with node
     * @param {Node} aNode - The node
     * @returns {SvTile|undefined}
     * @category Data
     */
    tileWithNode (aNode) {
        //return this.tiles().detect(tile => tile.node() === aNode);
        return this.tiles().detect(tile => tile.nodeTileLink() === aNode);
        //return this.tiles().detect(tile => tile.node().nodeTileLink() === aNode);
    }


    /**
     * @description Gets index of tile
     * @param {SvTile} aTile - The tile
     * @returns {number}
     * @category Data
     */
    indexOfTile (aTile) {
        // we might want this to be based on flex view order instead,
        // so best to keep it abstract
        return this.indexOfSubview(aTile);
    }

    /**
     * @description Gets tile at index
     * @param {number} anIndex - The index
     * @returns {SvTile}
     * @category Data
     */
    tileAtIndex (anIndex) {
        return this.subviews().at(anIndex);
    }
    /**
     * @description Gets max tile width
     * @returns {number}
     * @category UI
     */
    maxTileWidth () {
        if (this.tiles().length === 0) {
            return 0;
        }

        const maxWidth = this.tiles().maxValue(tile => tile.desiredWidth());
        return maxWidth;
    }

    // --- sync ---

    /**
     * @description Syncs from node
     * @returns {SvTilesView}
     * @category Sync
     */
    syncFromNode () {
        this.syncOrientation(); // implemented in Tiles_orientation.js
        super.syncFromNode();

        // Accessibility: label the list from its node title
        const node = this.node();
        if (node) {
            const label = node.title();
            if (label) {
                this.setAttribute("aria-label", label);
            }

            // Opt-in live region: node can declare nodeAriaLive() returning "polite" or "assertive"
            if (node.nodeAriaLive) {
                const liveValue = node.nodeAriaLive();
                if (liveValue) {
                    this.setAttribute("aria-live", liveValue);
                }
            }
        }

        /*
        if (this.node().nodeMinTileHeight()) {
            this.setMinAndMaxHeight(this.node().nodeMinTileHeight());
        }
        */

        /*
        if (this.selectedTiles().length === 0) {
            //this.didChangeNavSelection(); // TODO: is this right?
        }
        */
        return this;
    }

    /**
     * @description Gets subview proto for subnode
     * @param {Node} aSubnode - The subnode
     * @returns {SvTile}
     * @category Initialization
     */
    subviewProtoForSubnode (aSubnode) {
        let proto = aSubnode.nodeTileClass(); // we need this to get tile versions of view

        if (!proto) {
            proto = this.defaultSubviewProto();
        }

        return proto;
    }

    /**
     * @description Called when node changes
     * @returns {SvTilesView}
     * @category Sync
     */
    didChangeNode () {
        super.didChangeNode();

        if (this.node() && this.node().nodeTilesStartAtBottom()) {
            this.setTransition("none");
            this.setAnimation("none");
            this.element().style.scrollBehavior = "auto";
            this.element().offsetHeight; // force reflow
            this.addWeakTimeout(() => { this.scrollToBottom(); }, 0);
            //this.tile().last().scrollIntoView();
        }

        return this;
    }


    // --- duplicating tiles ---

    /**
     * @description Duplicates selected tile
     * @category Data
     */
    duplicateSelectedTile () {
        const node = this.node();
        const tile = this.selectedTile();
        const canAdd = node.nodeCanAddSubnode();
        if (tile && canAdd) {
            const canCopy = !Type.isNullOrUndefined(tile.node().copy);
            if (canCopy) {
                //this.logDebug(" duplicate selected tile " + this.selectedTile().node().title());
                const subnode = tile.node();
                const newSubnode = subnode.copy();
                const index = node.indexOfSubnode(subnode);
                node.addSubnodeAt(newSubnode, index);
                this.scheduleSyncFromNode();
            }
        }
    }

    /**
     * @description Duplicates selected tiles
     * @returns {SvTilesView}
     * @category Data
     */
    duplicateSelectedTiles () {
        const newNodes = [];

        this.selectedTiles().forEach(tile => {
            const i = this.indexOfSubview(tile);
            const dupNode = tile.node().duplicate();
            newNodes.push(dupNode);
            this.node().addSubnodeAt(dupNode, i + 1);
        });
        this.unselectAllTiles();
        this.syncFromNodeNow();

        // TODO: unselect current tiles at browser level
        newNodes.forEach(newNode => {
            const newTile = this.tileWithNode(newNode);
            if (newTile) {
                newTile.select();
            }
        });

        return this;
    }

    // --- inspecting ---

    /**
     * @description Checks if inspecting
     * @returns {boolean}
     * @category State
     */
    isInspecting () {
        /*
        if (this.isColumnInspecting()) {
            return true;
        }
        */
        // see if the tile that selected this column is being inspected
        const prev = this.previousItemSet();
        if (prev) {
            const tile = prev.selectedTile();
            if (tile) {
                return tile.isInspecting();
            }
        }
        return false;
    }

    /*
    setIsColumnInspecting (aBool) {
        if (this._isColumnInspecting !== aBool) {
            this._isColumnInspecting = aBool;
            this.scheduleSyncFromNode();
        }
        return this;
    }
    */

    // -----------------------------

    /**
     * @description Gets column index
     * @returns {number}
     * @category Navigation
     */
    columnIndex () {
        return this.parentViewsOfClass(SvStackView).length;
    }

    // next column

    /**
     * @description Gets next column
     * @returns {SvTilesView|null}
     * @category Navigation
     */
    nextColumn () {
        const nsv = this.stackView().nextStackView();
        if (nsv) {
            return nsv.navView().tilesView();
        }
        return null;
    }

    // previous column

    /**
     * @description Gets previous item set
     * @returns {SvTilesView|null}
     * @category Navigation
     */
    previousItemSet () {
        if (this.stackView()) {
            const ps = this.stackView().previousStackView();
            if (ps) {
                return ps.navView().tilesView();
            }
        }
        return null;
    }

    // --- editing ---

    /**
     * @description Handles double click event
     * @param {Event} event - The double click event
     * @returns {boolean}
     * @category Events
     */
    onDoubleClick (/*event*/) {
        //this.logDebug(".onDoubleClick()");
        return true;
    }

    // --- debugging ---

    /*
    setNode (aNode) {
        if (this.node() && Type.isNull(aNode)) {
            console.log(this.svDebugId() + " setNode(null)");

        }
        super.setNode(aNode);
        return this;
    }
    */

    // --- browser drop ---

    /**
     * @description Handles browser drop chunk
     * @param {Object} dataChunk - The data chunk
     * @category Events
     */
    onBrowserDropChunk (dataChunk) {
        const node = this.node();
        console.log("[SvTilesView] onBrowserDropChunk mimeType:", dataChunk.mimeType(), "node:", node ? node.title() : "(none)");

        if (node && node.onBrowserDropChunk) {
            node.onBrowserDropChunk(dataChunk);
        }
        this.scheduleSyncFromNode();
    }

    /*
    scheduleSyncFromNode () {
        console.warn(this.svTypeId() + " scheduleSyncFromNode");
        return super.scheduleSyncFromNode();
    }
    */

    // copy and paste keyboard events

    onMetaLeft_c_KeyDown (/*event*/) {
        // MacOScopy
        this.logDebug("onMetaLeft_c_KeyDown");
    }

    onMetaLeft_v_KeyDown (/*event*/) {
        // MacOS paste
        this.logDebug("onMetaLeft_v_KeyDown");
    }

    onControl_c_KeyDown (/*event*/) {
        // Windows copy
        this.logDebug("onControl_c_KeyDown");
    }

    onControl_v_KeyDown (/*event*/) {
        // Windows paste
        this.logDebug("onControl_v_KeyDown");
    }

}.initThisClass());
