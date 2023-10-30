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

        /*
            We need a way of enabling/dissabling the options
            depending on whether the node value is editable.
            We still want the subnodes to be visible, 
            we just don't want to allow the selection to chage.
        */

        /*
        if (this.node().valueIsEditable()) {
        } else {
        }
        */
        return this
    }
	
}.initThisClass());
