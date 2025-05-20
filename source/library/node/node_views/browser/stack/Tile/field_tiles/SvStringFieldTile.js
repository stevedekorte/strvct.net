/**
 * @module browser.stack.Tile.field_tiles
 * @class SvStringFieldTile
 * @extends SvFieldTile
 * @classdesc SvStringFieldTile class for handling string field tiles.
 */
(class SvStringFieldTile extends SvFieldTile {
    
    /*
    initPrototypeSlots () {
            }

    initPrototype () {
    }

    init () {
        super.init()
        return this
    }
    */

    /**
     * Creates and configures a value view for the string field tile.
     * @returns {TextField} The configured TextField instance.
     * @description Creates a TextField instance and sets its display properties.
     * @category UI
     */
    createValueView () {
        const v = TextField.clone()
        v.setDisplay("block")
        v.setPosition("relative")
        v.setWordWrap("normal")
        v.setHeight("auto")
        v.setWidth("-webkit-fill-available")
        v.setTextAlign("left")
        v.setMargin("0em")
        v.setOverflowX("hidden")
        v.setBorderRadius("0.2em")
        return v
    }
    
}.initThisClass());