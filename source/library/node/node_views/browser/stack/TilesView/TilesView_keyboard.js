"use strict";

/*
    
    TilesView_keyboard
    
*/

(class TilesView_keyboard extends TilesView {
    
    // --- keyboard controls, arrow navigation ---

    canNavigate () {
        return this.allowsCursorNavigation() 
        //return this.allowsCursorNavigation() && this.isActiveElement()
    }

    // --- controls ---

    onMetaKeyDown (event) {
        console.log("new folder")
        event.stopPropagation()
        event.preventDefault();
    }

    onMeta_m_KeyDown (event) {
        console.log("new folder")
        event.stopPropagation()
        event.preventDefault()
    }

    onMeta_d_KeyDown (event) {
        console.log("duplicate selection down")
        this.duplicateSelectedTiles()
        event.stopPropagation()
        event.preventDefault();
    }

    onMeta_d_KeyUp (event) {
        console.log("duplicate selection up")
        this.selectedTiles().forEach()
        event.stopPropagation()
        event.preventDefault();
    }

    onShiftBackspaceKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onShiftBackspaceKeyUp")
        if (this.selectedTile()) { 
            this.selectedTile().delete()
        }
        event.stopPropagation()
    }

    onShiftPlusKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onShiftPlusKeyUp")
        this.addIfPossible()
        event.stopPropagation()
    }

    addIfPossible () {
        const node = this.node()

        if (node.canSelfAddSubnode()) {
            const newNode = node.add()
            if (newNode) {
                this.syncFromNode()
                const newSubview = this.subviewForNode(newNode)
                newSubview.justTap()
            }
        }
    }

    // --- duplicate ---

    onAlternate_d_KeyUp (event) {
        //this.debugLog(" onMetaLeft_d_KeyUp")
        this.duplicateSelectedTile()
        return false // stop propogation
    }

    // select all

    onMeta_a_KeyDown (event) {
        this.selectAllTiles()
        event.stopPropagation()
        return false // stop propogation
    }


    onControl_c_KeyUp (event) {
        // copy?
    }

    onControl_p_KeyUp (event) {
        // paste?
    }

    // --- arrow keys ---

    onUpArrowKeyDown (event) {
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
	
    onDownArrowKeyDown (event) {
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

    moveRight () {
        this.selectNextColumn()
        return this
    }

    moveUp () {
        this.selectNextTile()
        this.showSelected()
        return this
    }

    moveDown () {
        this.selectPreviousTile()
        this.showSelected()
        return this
    }

    // --- escape ---

    onEscapeKeyDown (event) {
        //this.setIsColumnInspecting(false)

        if (!this.canNavigate()) { 
            return this
        }	

        this.moveLeft()
        //return true
    }
	
    // --- enter key begins tile editing ---
	
    onEnterKeyUp (event) {        
        if (!this.canNavigate()) { 
            return this
        }
	
        const tile = this.selectedTile()
        if (tile) { 
		    tile.onEnterKeyUp(event)
        }

        return false
    }

    // --- keyboard controls, add and delete actions ---

    /*
    deleteTile (aTile) {
        let sNode = aTile.node()
        if (sNode && sNode.canDelete()) { 
			sNode.performAction("delete") 
		}
        return this
    }

    deleteSelectedTiles () {
        this.selectedTiles().forEach(r => this.deleteTile(r))

        if (this.tiles().length === 0) {
            this.selectPreviousColumn()
        }
    }
    */

    onShiftDeleteKeyUp (event) {
        if (!this.canNavigate()) { 
            return 
        }

        //this.deleteSelectedTiles()
        return false
    }
	
    onPlusKeyUp (event) {
        if (!this.canNavigate()) { 
            return 
        }		

        const sNode = this.selectedNode()
        if (sNode && sNode.hasAction("add")) { 
            const newNode = sNode.performAction("add") 
            this.selectNextColumn()
            if (this.nextColumn()) {
                this.nextColumn().selectTileWithNode(newNode)
            }
        }
        return false		
    }
	

}.initThisCategory());
