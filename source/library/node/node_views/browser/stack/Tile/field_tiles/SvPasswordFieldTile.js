/**
 * @module browser.stack.Tile.field_tiles
 * @class SvPasswordFieldTile
 * @extends SvStringFieldTile
 * @classdesc SvPasswordFieldTile class for handling password field tiles. Uses SvPasswordView for native password input behavior.
 */
(class SvPasswordFieldTile extends SvStringFieldTile {
    
    /**
     * @description Initializes the password field tile
     * @returns {SvPasswordFieldTile} The current instance
     * @category Initialization
     */
    init () {
        console.log("SvPasswordFieldTile.init() - Starting initialization");
        super.init();
        console.log("SvPasswordFieldTile.init() - Initialization complete");
        return this;
    }
    
    /**
     * Creates and configures a value view for the password field tile.
     * @returns {SvPasswordView} The configured SvPasswordView instance.
     * @description Creates a SvPasswordView instance which provides native password masking and password manager integration.
     * @category UI
     */
    createValueView () {
        console.log("SvPasswordFieldTile.createValueView() - Creating SvPasswordView");
        const v = SvPasswordView.clone();
        console.log("SvPasswordFieldTile.createValueView() - SvPasswordView cloned:", v);
        v.setDisplay("block");
        v.setPosition("relative");
        v.setWordWrap("normal");
        v.setHeight("auto");
        v.setWidth("-webkit-fill-available");
        v.setTextAlign("left");
        v.setMargin("0em");
        v.setOverflowX("hidden");
        v.setBorderRadius("0.2em");
        console.log("SvPasswordFieldTile.createValueView() - Returning configured view:", v);
        return v;
    }
    
}.initThisClass());