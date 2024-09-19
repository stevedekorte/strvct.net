/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class BMPointerFieldTile
 * @extends TitledTile
 * @classdesc Represents a pointer field tile in the browser stack.
 */
(class BMPointerFieldTile extends TitledTile {
    
    /**
     * @description Initializes the prototype slots for the BMPointerFieldTile class.
     * @private
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the BMPointerFieldTile instance.
     * @returns {BMPointerFieldTile} The initialized instance.
     */
    init () {
        super.init()

        this.makeNoteRightArrow()
		
        return this
    }

    /**
     * @description Updates the subviews of the BMPointerFieldTile.
     * @returns {BMPointerFieldTile} The instance after updating subviews.
     */
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