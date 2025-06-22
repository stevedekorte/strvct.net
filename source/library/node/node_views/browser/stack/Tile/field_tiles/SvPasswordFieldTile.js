/**
 * @module browser.stack.Tile.field_tiles
 * @class SvPasswordFieldTile
 * @extends SvStringFieldTile
 * @classdesc SvPasswordFieldTile class for handling password field tiles. Uses SvPasswordView for native password input behavior.
 */
(class SvPasswordFieldTile extends SvStringFieldTile {
    
    /**
     * Creates and configures a value view for the password field tile.
     * @returns {SvPasswordView} The configured SvPasswordView instance.
     * @description Creates a SvPasswordView instance which provides native password masking and password manager integration.
     * @category UI
     */
    createValueView () {
        const v = SvPasswordView.clone();
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
    
}.initThisClass());