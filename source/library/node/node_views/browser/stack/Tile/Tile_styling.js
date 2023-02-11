"use strict";

/*
    
    Tile_styling

*/

(class Tile_styling extends Tile {
    
    
    didUpdateSlotParentView (oldValue, newValue) {
        super.didUpdateSlotParentView(oldValue, newValue)
        //this.scheduleMethod("applyStyles")
        this.applyStyles()
        return this
    }

    // --- css pass-through to contentView ---

    setBackgroundColor (s) {
        this.contentView().setBackgroundColor(s)
        return this
    }

    setColor (s) {
        this.contentView().setColor(s)
        return this
    }

    setOpacity (v) {
        this.contentView().setOpacity(v)
        return this
    }

    // --- styles ---

    /*
    applyStyles () {
        super.applyStyles()

        // flash
        
        if (this.shouldShowFlash() && this.selectedFlashColor()) {
            this.setBackgroundColor(this.selectedFlashColor())
            this.setTransition("background-color 0.3s")
            //this.addTimeout(() => { this.setBackgroundColor(this.currentBgColor()) }, 100)
            this.addTimeout(() => { super.applyStyles() }, 100)
            this.setShouldShowFlash(false)
        }
        
        return this
    }
    */
    
    
}.initThisCategory());
