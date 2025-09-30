/**
 * @module browser.stack.Tile.field_tiles
 * @class SvPasswordFieldTile
 * @extends SvStringFieldTile
 * @classdesc SvPasswordFieldTile class for handling password field tiles. Uses SvPasswordView for native password input behavior.
 *
 * NOTES:
 * other attributes of the password input element we could make use of:
 *
    - maxlength: Limits number of characters.
    - required: Prevents form submission if left empty.
    - autocomplete="off" or "new-password": Helps control browser autofill behavior.
    - pattern: Can be used for client-side validation (e.g., pattern=".{8,}" for minimum 8 characters).
 */

(class SvPasswordFieldTile extends SvStringFieldTile {

    /**
     * @description Initializes the password field tile
     * @returns {SvPasswordFieldTile} The current instance
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

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
        v.setFontSize("1em");
        v.setMinHeight("1.9em");
        v.setHeight("1.9em");
        v.setWidth("100%");
        v.setTextAlign("left");
        v.setMargin("0em");
        v.setOverflowX("hidden");
        v.setBorderRadius("0.2em");
        return v;
    }

}.initThisClass());
