/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class SvPointerFieldTile
 * @extends TitledTile
 * @classdesc Represents a pointer field tile in the browser stack.
 */
(class SvPointerFieldTile extends TitledTile {
    
    /**
     * @description Initializes the prototype slots for the SvPointerFieldTile class.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the BMPointerFieldTile instance.
     * @returns {SvPointerFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()

        this.makeNoteRightArrow()
		
        return this
    }

    /**
     * @description Updates the subviews of the BMPointerFieldTile.
     * @returns {SvPointerFieldTile} The instance after updating subviews.
     * @category UI Update
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