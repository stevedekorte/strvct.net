"use strict";

/*

    BMPointerFieldTile

*/

(class BMPointerFieldTile extends TitledTile {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()

        this.makeNoteRightArrow()
		
        return this
    }

    updateSubviews () {	
        super.updateSubviews()
		
        let node = this.node()

        if (this.isSelected()) {
            this.noteView().setOpacity(1)	
        } else {
            this.noteView().setOpacity(0.4)	
        }

        this.applyStyles()
		
        return this
    }
    
}.initThisClass());
