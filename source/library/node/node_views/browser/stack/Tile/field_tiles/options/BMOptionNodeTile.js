"use strict";

/*

    BMOptionNodeTile 

 
*/

(class BMOptionNodeTile extends TitledTile {
    
    /*
    initPrototypeSlots () {

    }

    init () {
        super.init()
        //this.setHasSubtitle(true)
        return this
    }
    */

    /*
    activate () {
        super.activate()
        this.toggle()
        return this
    }
    */

    toggle () {
        //debugger
        const canToggle = this.node().optionsNode().valueIsEditable();
        if (canToggle) {
            this.node().toggle()
        }
        return this
    }

    onEnterKeyUp (event) {
        //debugger;
        super.onEnterKeyUp(event)
        this.toggle()
        event.stopPropagation()
        return this
    }
    
    onTapComplete (aGesture) {
        //debugger;
        super.onTapComplete(aGesture)
        this.toggle()
        //event.stopPropagation() // is this correct? this prevents tiles from doing selection?
        return this
    }

    syncToNode () {
        super.syncToNode()
        
        return this
    }

}.initThisClass());
