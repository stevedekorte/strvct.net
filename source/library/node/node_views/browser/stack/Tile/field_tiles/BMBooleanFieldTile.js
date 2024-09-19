"use strict";

/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class BMBooleanFieldTile
 * @extends BMFieldTile
 * @classdesc Represents a boolean field tile in the browser stack.
 */
(class BMBooleanFieldTile extends BMFieldTile {
    
    /*
    initPrototypeSlots () {
    }
    */

    /**
     * @description Initializes the BMBooleanFieldTile.
     * @returns {BMBooleanFieldTile} The initialized instance.
     */
    init () {
        super.init()
        
        this.turnOffUserSelect()
        this.keyView().setTransition("color 0.3s")
        this.keyView().setPaddingLeft("0.5em")

        this.valueView().parentView().flexCenterContent()
        this.valueView().setPaddingBottom("0em")

        this.keyView().setPaddingTop("0em")
        this.keyView().setPaddingBottom("0.35em")

        //this.contentView().debugBorders()
        this.kvSection().subviews().at(1).flexCenterContent()
        //this.contentView().setFlexDirection("column")
        this.kvSection().setFlexDirection("row").makeSubviewsReverseOrdered()
        //this.kvSection().subviews().forEach(sv => sv.setAlignItems("center"))
        this.kvSection().subviews().forEach(sv => sv.flexCenterContent())
        //this.keyView().parentView().swapSubviews(this.keyView(), this.valueView())

        this.setValueEditableBorder("none")
        this.setValueUneditableBorder("none")

        return this
    }

    /**
     * @description Creates and returns a BooleanView for the value.
     * @returns {BooleanView} The created BooleanView instance.
     */
    createValueView () {
        const bv = BooleanView.clone()
        return bv
    }
	
    /**
     * @description Returns the BooleanView used for the value.
     * @returns {BooleanView} The BooleanView instance.
     */
    booleanView () {
        return this.valueView()
    }

    /**
     * @description Synchronizes the tile with its associated node and updates the appearance.
     * @returns {BMBooleanFieldTile} The current instance.
     */
    syncFromNode () {
        super.syncFromNode()
        this.booleanView().updateAppearance()
        return this
    }
    
}.initThisClass());