"use strict";

/*

    BMOptionsNodeTile 

    View for BMOptionsNode

    BMOptionsNode -> BMOptionsNodeTile
        BMOption -> BMSingleOptionTile
        BMMultiOption -> BMMultiOptionTile

*/


(class BMOptionsNodeTile extends TitledTile {
    
    /*
    initPrototypeSlots () {

    }

    init () {
        super.init()
        return this
    }
    */

    syncFromNode () {
        super.syncFromNode()
        if (this.valueIsEditable()) {

        } else {

        }
        return this
    }
	
}.initThisClass());
