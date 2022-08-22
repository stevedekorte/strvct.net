"use strict";

/*
    
    Tile_keyboard

*/

(class Tile_keyboard extends Tile {
    
    // --- keyboard controls ---

    onEnterKeyUp () {
        //this.debugLog(this.type() + " for " + this.node().title() + " onEnterKeyUp")
        this.justTap()
        return false // stop propogation
    }

    onShiftBackspaceKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onBackspaceKeyUp")
        this.delete()
        return false // stop propogation
    }

    // --- dragging key ---

    onMeta_a_KeyDown (event) {
        // only select subnodes if this tile can have them,
        // otherwise, like the column handle this event
        const c = this.column().nextColumn()
        if (c) {
            c.selectAllTiles()
        }
        event.stopPropagation()
        return false 
    }

    on_d_KeyDown (event) {
        this.debugLog(" on_d_KeyDown ", event._id)
        this.setIsRegisteredForBrowserDrag(true)
        return true
    }

    on_d_KeyUp (event) {
        this.debugLog(" on_d_KeyUp ", event._id)
        this.setIsRegisteredForBrowserDrag(false)
        return true
    }

    /*
    onEscapeKeyDown (event) {
        console.log(" onEscapeKeyDown ", event._id)
        this.column().onLeftArrowKeyUp()
        return true
    }
    */

}.initThisCategory());
