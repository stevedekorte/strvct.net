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

    styles () { 
        const lookedUpStyles = this.lookedUpStyles()
        if (lookedUpStyles) {
            return lookedUpStyles
        } else {
            this.lookedUpStyles() // for debugging
        }
        throw new Error("missing styles")
    }

    applyStyles () {
        super.applyStyles()

        // flash
        
        /*
        if (this.shouldShowFlash() && this.selectedFlashColor()) {
            this.setBackgroundColor(this.selectedFlashColor())
            this.setTransition("background-color 0.3s")
            //this.addTimeout(() => { this.setBackgroundColor(this.currentBgColor()) }, 100)
            this.addTimeout(() => { super.applyStyles() }, 100)
            this.setShouldShowFlash(false)
        }
        */
        
        return this
    }

        
    // node style dict
    
    tileStyles () {
        return null
    }

    lookedUpStyles () {
        debugger;
        
        const debugStyles = false

        if (this.node()) {
            const ns = this.node().nodeTileStyles()
            if (ns) {
                if (debugStyles) {
                    this.debugLog(" using nodeTileStyles")
                }
                return ns
            }
        }

        const rs = this.tileStyles()
        if (rs) {
            if (debugStyles) {
                this.debugLog(" using tileStyles")
            }
            return rs
        }

        if (this.column() && this.column().tileStyles) {
            const cs = this.column().tileStyles()
            if (cs) {
                if (debugStyles) {
                    this.debugLog(" using column().tileStyles()")
                }
                return cs
            }
        } else if (debugStyles) {
            const title = this.node() ? this.node().title() : "no node yet"
            this.debugLog(" (" + title + ") has no column yet")
        }

        return BMViewStyles.shared().sharedWhiteOnBlackStyle()
    }

    
    /*
    currentTileStyle () {
        const styles = this.node().nodeTileStyles()
        //styles.selected().set
        
        if (this.isSelected()) {
        	return styles.selected()
 		}
        
        return styles.unselected()
    }
    */
   
}.initThisCategory());
