"use strict";

/*
    
    TilesView

    Contains array of Tile (and Tile decendant class) views.
    Parent is a StackScrollView, whose parent is a NavView.
    
*/

(class TilesView extends NodeView {
    
    initPrototypeSlots () {
        this.newSlot("tiles", null)
        this.newSlot("allowsCursorNavigation", true)
        this.newSlot("tilePlaceHolder", null)
        this.newSlot("hasPausedSync", false)
        //this.newSlot("isColumnInspecting", false)
    }

    init () {
        super.init()
        //this.setDisplay("block") // if block is used, there with be gaps between rows despite 0 margins!
        this.setDisplay("flex")


        this.setPosition("relative")
        //this.setFlexBasis("fit-content")
        //this.setFlexGrow(0)
        //this.setFlexShrink(0)
        this.makeOrientationRight()

        this.setOverflow("hidden")
        this.setWebkitOverflowScrolling("regular")
        this.setMsOverflowStyle("none")
        this.setUserSelect("none")

        this.setIsDebugging(false)
        this.setIsRegisteredForKeyboard(true)
        this.setAcceptsFirstResponder(true)

        this.setUserSelect("none")
        this.addGestureRecognizer(PinchGestureRecognizer.clone()) // for pinch open to add tile
        this.addGestureRecognizer(TapGestureRecognizer.clone()) // for pinch open to add tile

        this.setIsRegisteredForBrowserDrop(true)
        
        //this.setBorder("1px dashed red")
        this.setDefaultSubviewProto(TitledTile)
        return this
    }

    // --- helpers ---
    // subview path: StackView -> NavView -> ScrollView -> TilesView -> Tiles

    scrollView () {
        return this.parentView()
    }

    navView () {
        return this.scrollView().parentView()
    }

    stackView () {
        return this.navView().parentView()
    }

    /*
    browser () {
        return this.stackView()
    }
    */

    // --- title ---
    
    title () {
        return this.node() ? this.node().title() : ""
    }

    // --- accessing tiles ---
    
    tiles () {
        return this.subviews()
    }

    addTile (v) {
        return this.addSubview(v)
    }

    removeTile (v) {
        return this.removeSubview(v)
    }

    tilesWithNodes (nodeArray) {
        return nodeArray.map(node => this.tileWithNode(node))
    }

    tileWithNode (aNode) {
        return this.tiles().detect(tile => tile.node() === aNode)
    }

    indexOfTile (aTile) {
        // we might want this to be based on flex view order instead, 
        // so best to keep it abstract
        return this.indexOfSubview(aTile)
    }

    tileAtIndex (anIndex) {
        return this.subviews().at(anIndex)
    }

    tileWithNode (aNode) {
        const tile = this.tiles().detect(tile => tile.node().nodeTileLink() === aNode)
        return tile
    }

    maxTileWidth () {
        if (this.tiles().length === 0) {
            return 0
        }
        
        const maxWidth = this.tiles().maxValue(tile => tile.desiredWidth())			
        return maxWidth	
    }
	
    // --- sync ---

    syncFromNode () {
        this.syncOrientation() // implemented in Tiles_orientation.js
        super.syncFromNode() 

        /*
        if (this.node().nodeMinTileHeight()) {
            this.setMinAndMaxHeight(this.node().nodeMinTileHeight())
        }
        */

        /*
        if (this.selectedTiles().length === 0) {
            //this.didChangeNavSelection() // TODO: is this right?
        }
        */
        return this
    }


    subviewProtoForSubnode (aSubnode) {
        let proto = aSubnode.nodeTileClass() // we need this to get tile versions of view
		
        if (!proto) {
            proto = this.defaultSubviewProto()
        }
				
        return proto      
    }

    didChangeNode () {
        super.didChangeNode()

        if (this.node() && this.node().nodeTilesStartAtBottom()) {
            this.addTimeout(() => { this.scrollToBottom() }, 0)
            //this.tile().last().scrollIntoView()
        }

        return this
    }

    // --- duplicating tiles ---

    duplicateSelectedTile () {
        const node = this.node()
        const tile = this.selectedTile()
        const canAdd = node.canSelfAddSubnode() 
        if (tile && canAdd) {
            const canCopy = !Type.isNullOrUndefined(tile.node().copy)
            if (canCopy) { 
                //this.debugLog(" duplicate selected tile " + this.selectedTile().node().title())
                const subnode = tile.node()
                const newSubnode = subnode.copy()
                const index = node.indexOfSubnode(subnode)
                node.addSubnodeAt(newSubnode, index)
                this.scheduleSyncFromNode()
            }
        }
    }

    duplicateSelectedTiles () {
        const newNodes = []

        this.selectedTiles().forEach(tile => {
            const i = this.indexOfSubview(tile)
            const dupNode = tile.node().duplicate()
            newNodes.push(dupNode)
            this.node().addSubnodeAt(dupNode, i+1)
        })
        this.unselectAllTiles()
        this.syncFromNodeNow()

        // TODO: unselect current tiles at browser level
        newNodes.forEach(newNode => {
            const newTile = this.tileWithNode(newNode)
            if (newTile) {
                newTile.select()
            }
        })

        return this
    }

    // --- inspecting ---

    isInspecting () {
        /*
        if (this.isColumnInspecting()) {
            return true
        }
        */
        // see if the tile that selected this column is being inspected
        const prev = this.previousItemSet() 
        if (prev) {
            const tile = prev.selectedTile()
            if (tile) {
                return tile.isInspecting()
            }
        }
        return false
    }
    
    /*
    setIsColumnInspecting (aBool) {
        if (this._isColumnInspecting !== aBool) {
            this._isColumnInspecting = aBool
            this.scheduleSyncFromNode()
        }
        return this
    }
    */

    // -----------------------------

    columnIndex () {
        return this.parentViewsOfClass(StackView).length
    }

    // next column
    
    nextColumn () {
        const nsv = this.stackView().nextStackView()
        if (nsv) {
            return nsv.navView().tilesView()
        }
        return null
    }

    // previous column
	
    previousItemSet () {
        if (this.stackView()) {
            const ps = this.stackView().previousStackView()
            if (ps) {
                return ps.navView().tilesView()
            }
        }
        return null
    }

    // --- editing ---

    onDoubleClick (event) {
        //this.debugLog(".onDoubleClick()")
        return true
    }

    // --- debugging ---

    /*
    setNode (aNode) {
        if (this.node() && Type.isNull(aNode)) {
            console.log(this.debugTypeId() + " setNode(null)")
            //debugger;
        }
        super.setNode(aNode)
        return this
    }
    */

    // --- browser drop ---

    onBrowserDropChunk (dataChunk) {
        const node = this.node()

        if (node && node.onBrowserDropChunk) {
            node.onBrowserDropChunk(dataChunk)
        }
        this.scheduleSyncFromNode()
    }

    /*
    scheduleSyncFromNode () {
        console.warn(this.typeId() + " scheduleSyncFromNode")
        return super.scheduleSyncFromNode()
    }
    */
    
}.initThisClass());
