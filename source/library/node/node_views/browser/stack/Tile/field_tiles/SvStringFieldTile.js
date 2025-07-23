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
        const v = SvTextView.clone();
        v.setDisplay("block");
        v.setPosition("relative");
        v.setWordWrap("normal");
        v.setHeight("auto");
        v.setWidth("-webkit-fill-available");
        v.setTextAlign("left");
        v.setMargin("0em");
        v.setOverflowX("hidden");
        v.setBorderRadius("0.2em");
        return v;
    }

    syncValueFromNode () {
        const node = this.node();
       
        const valueAllowsHtml = (node.valueAllowsHtml ? node.valueAllowsHtml() : null);
        if (!Type.isNull(valueAllowsHtml)) {
            const vv = this.valueView();
            if (vv.setAllowsHtml) {
                vv.setAllowsHtml(valueAllowsHtml);
                if (valueAllowsHtml) {
                    vv.setIsEditable(false); // TODO: make sure this doesn't get overridden 
                }
            }
        }

        const valueWhiteSpace = (node.valueWhiteSpace ? node.valueWhiteSpace() : null);
        if (!Type.isNull(valueWhiteSpace)) {
            const vv = this.valueView();
            if (vv.setWhiteSpace) {
                vv.setWhiteSpace(valueWhiteSpace);
            }
        }

        super.syncValueFromNode();
    }
    
}.initThisClass());