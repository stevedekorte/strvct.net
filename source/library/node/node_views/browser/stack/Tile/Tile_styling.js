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

}.initThisCategory());
