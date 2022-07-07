"use strict";

/*

    BMOptionNodeTile 

 
*/

(class BMOptionNodeTile extends TitledTile {
    
    /*
    initPrototype () {

    }

    init () {
        super.init()
        //this.setHasSubtitle(true)
        return this
    }
    */

    toggle () {
        this.node().toggle()
        return this
    }

    onEnterKeyUp (event) {
        super.onEnterKeyUp(event)
        this.toggle()
        return this
    }
    
    onTapComplete (aGesture) {
        super.onTapComplete(aGesture)
        this.toggle()
        return this
    }

    syncToNode () {
        super.syncToNode()
        return this
    }
	
}.initThisClass());
