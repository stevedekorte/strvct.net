"use strict";

/**
 * @module library.node.node_views.browser.stack.TilesView
 * @class TilesView_keyboard
 * @extends TilesView
 * @classdesc TilesView_keyboard class for handling keyboard controls and arrow navigation in TilesView
 */
(class TilesView_keyboard extends TilesView {
    
    // --- keyboard controls, arrow navigation ---

    /**
     * @description Checks if navigation is allowed
     * @returns {boolean} True if cursor navigation is allowed
     */
    canNavigate () {
        return this.allowsCursorNavigation() 
        //return this.allowsCursorNavigation() && this.isActiveElement()
    }

    // --- controls ---

    /*
    onShiftDeleteKeyUp (event) {
        if (!this.canNavigate()) { 
            return 
        }

        this.deleteSelectedTiles()
        return false
    }
    */

    /**
     * @description Handles meta+backspace key down event
     * @param {Event} event - The keyboard event
     */
    onMetaBackspaceKeyDown (event) {
        console.log("meta backspace")
        this.onMetaDeleteKeyDown(event)
    }

    /**
     * @description Handles meta+delete key down event
     * @param {Event} event - The keyboard event
     */
    onMetaDeleteKeyDown (event) {
        console.log("meta delete")
        if (!this.canNavigate()) { 
            return 
        }

        this.deleteSelectedTiles()
        event.stopPropagation()
        event.preventDefault();
    }

    /**
     * @description Handles meta key down event
     * @param {Event} event - The keyboard event
     */
    onMetaKeyDown (event) {
        // do we need to hook this to avoid meta being stolen by app? 
        event.stopPropagation()
        event.preventDefault();
    }

    /**
     * @description Handles meta+d key down event to duplicate selected tiles
     * @param {Event} event - The keyboard event
     */
    onMeta_d_KeyDown (event) {
        console.log("duplicate selection down")
        this.duplicateSelectedTiles()
        event.stopPropagation()
        event.preventDefault();
    }

    /**
     * @description Handles meta+n key down event to add a new item if possible
     * @param {Event} event - The keyboard event
     */
    onMeta_n_KeyDown (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onMeta_n_KeyDown")
        this.addIfPossible()
        event.stopPropagation()
        event.preventDefault()
    }

    /**
     * @description Handles shift+backspace key up event to delete the selected tile
     * @param {Event} event - The keyboard event
     */
    onShiftBackspaceKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onShiftBackspaceKeyUp")
        if (this.selectedTile()) { 
            this.selectedTile().delete()
        }
        event.stopPropagation()
    }

    /**
     * @description Adds a new subnode if possible
     */
    addIfPossible () {
        const node = this.node()

        if (node.nodeCanAddSubnode()) {
            const newNode = node.add()
            if (newNode) {
                this.syncFromNode()
                const newSubview = this.subviewForNode(newNode)
                newSubview.justTap()
            }
        }
    }

    // --- duplicate ---

    /**
     * @description Handles alternate+d key up event to duplicate the selected tile
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onAlternate_d_KeyUp (event) {
        //this.debugLog(" onMetaLeft_d_KeyUp")
        this.duplicateSelectedTile()
        return false // stop propogation
    }

    // select all

    /**
     * @description Handles meta+a key down event to select all tiles
     * @param {Event} event - The keyboard event
     */
    onMeta_a_KeyDown (event) {
        this.selectAllTiles()
        event.stopPropagation()
        event.preventDefault();
    }


    /**
     * @description Handles control+c key up event (currently empty)
     * @param {Event} event - The keyboard event
     */
    onControl_c_KeyUp (event) {
        // copy?
    }

    /**
     * @description Handles control+p key up event (currently empty)
     * @param {Event} event - The keyboard event
     */
    onControl_p_KeyUp (event) {
        // paste?
    }

    // --- shift arrow keys ---

    /*
    activateSelectedTile () {
        const tile = this.selectedTile()
        if (tile && tile.activate) {
            tile.activate()
        }
        return this
    }

    onShiftUpArrowKeyDown (event) {
        const result = this.onUpArrowKeyDown(event)
        this.activateSelectedTile()
        return result 
    }

    onShiftDownArrowKeyDown (event) {
        const result =  this.onDownArrowKeyDown(event)
        this.activateSelectedTile()
        return result
    }
    */

    // --- Alternate arrow keys ---

    /**
     * @description Handles alternate+up arrow key down event
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onAlternateUpArrowKeyDown (event) { // why down and not up?
        if (!this.canNavigate()) { 
            return 
        }

        if (this.isVertical()) {
            this.selectFirstTile()
        }
        return false
    }

    /**
     * @description Handles alternate+down arrow key down event
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onAlternateDownArrowKeyDown (event) { // why down and not up?
        if (!this.canNavigate()) { 
            return 
        }

        if (this.isVertical()) {
            this.selectLastTile()
        } 
        return false
    }

    /**
     * @description Handles alternate+left arrow key down event
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onAlternateLeftArrowKeyDown (event) { // why down and not up?
        if (!this.canNavigate()) { 
            return 
        }

        if (!this.isVertical()) {
            this.selectFirstTile()
        }
        return false
    }

    /**
     * @description Handles alternate+right arrow key down event
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onAlternateRightArrowKeyDown (event) { // why down and not up?
        if (!this.canNavigate()) { 
            return 
        }

        if (!this.isVertical()) {
            this.selectLastTile()
        } 
        return false
    }


    // --- normal arrow keys ---

    /**
     * @description Handles up arrow key down event
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onUpArrowKeyDown (event) { // why down and not up?
        if (!this.canNavigate()) { 
            return 
        }

        if (this.isVertical()) {
            this.moveDown()
        } else {
            this.moveLeft()
        }
        return false
    }
	
    /**
     * @description Handles down arrow key down event
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onDownArrowKeyDown (event) { // why down and not up?
        if (!this.canNavigate()) { 
            return 
        }

        if (this.isVertical()) {
            this.moveUp()
        } else {
            this.moveRight()
        }
        return false
    }
	
    /**
     * @description Handles left arrow key up event
     * @param {Event} event - The keyboard event
     * @returns {TilesView_keyboard} This instance
     */
    onLeftArrowKeyUp (event) {
        if (!this.canNavigate()) { 
            return this
        }	
        if (this.isVertical()) {
            this.moveLeft()
        } else {
            this.moveDown()
        }
    }
	
    /**
     * @description Handles right arrow key up event
     * @param {Event} event - The keyboard event
     * @returns {TilesView_keyboard} This instance
     */
    onRightArrowKeyUp (event) {
        if (!this.canNavigate()) { 
            return this
        }	

        if (this.isVertical()) {
            this.moveRight()
        } else {
            this.moveUp()
        }
    }

    // --- arrow moves ---

    /**
     * @description Moves selection to the left
     * @returns {TilesView_keyboard} This instance
     */
    moveLeft () {
        const pc = this.previousItemSet()	
        if (pc) {
            if (this.selectedTile()) { 
                this.selectedTile().unselect() 
            }
			
            const newSelectedTile = pc.selectedTile()
            newSelectedTile.setShouldShowFlash(true).updateSubviews()
            pc.didTapItem(newSelectedTile)
        	this.selectPreviousColumn()

            //debugger;
            pc.didChangeNavSelection()
        }
        return this
    }

    /**
     * @description Moves selection to the right
     * @returns {TilesView_keyboard} This instance
     */
    moveRight () {
        this.selectNextColumn()
        return this
    }

    /**
     * @description Moves selection up
     * @returns {TilesView_keyboard} This instance
     */
    moveUp () {
        this.selectNextTile()
        this.showSelected()
        return this
    }

    /**
     * @description Moves selection down
     * @returns {TilesView_keyboard} This instance
     */
    moveDown () {
        this.selectPreviousTile()
        this.showSelected()
        return this
    }

    // --- escape ---

    /**
     * @description Handles escape key down event
     * @param {Event} event - The keyboard event
     * @returns {TilesView_keyboard} This instance
     */
    onEscapeKeyDown (event) {
        //this.setIsColumnInspecting(false)

        if (!this.canNavigate()) { 
            return this
        }	

        this.moveLeft()
        //return true
    }
	
    // --- enter key begins tile editing ---
	
    /**
     * @description Handles enter key up event
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onEnterKeyUp (event) {        
        if (!this.canNavigate()) { 
            return this
        }
	
        // carefull - if Tile is registered fro keyboard,
        // this may cause onEnterKeyUp to be sent twice
        const tile = this.selectedTile()
        if (tile) { 
		    tile.onEnterKeyUp(event)
        }

        return false
    }

    // --- keyboard controls, add and delete actions ---

    /**
     * @description Deletes a specific tile
     * @param {Object} aTile - The tile to delete
     * @returns {TilesView_keyboard} This instance
     */
    deleteTile (aTile) {
        let sNode = aTile.node()
        if (sNode && sNode.canDelete()) { 
			sNode.performNodeAction("delete") 
		}
        return this
    }

    /**
     * @description Deletes all selected tiles
     */
    deleteSelectedTiles () {
        this.selectedTiles().forEach(r => this.deleteTile(r))

        if (this.tiles().length === 0) {
            this.selectPreviousColumn()
        }
    }
	
    /**
     * @description Handles plus key up event to add a new item
     * @param {Event} event - The keyboard event
     * @returns {boolean} False to stop propagation
     */
    onPlusKeyUp (event) {
        if (!this.canNavigate()) { 
            return 
        }		

        const sNode = this.selectedNode()
        if (sNode && sNode.hasNodeAction("add")) { 
            const newNode = sNode.performNodeAction("add") 
            this.selectNextColumn()
            if (this.nextColumn()) {
                this.nextColumn().selectTileWithNode(newNode)
            }
        }
        return false		
    }
	

}.initThisCategory());