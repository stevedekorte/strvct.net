/** * @module browser.stack.SvTile.field_tiles
 */

/** * @class SvActionFieldTile
 * @extends SvTile
 * @classdesc SvActionFieldTile is a specialized SvTile class for action fields.
 * It includes a button view and handles user interactions.
 
 
 */


"use strict";

(class SvActionFieldTile extends SvTile {

    initPrototypeSlots () {
        /**
         * @member {SvButtonView} buttonView - The button view for this action field tile.
         * @category UI
         */
        {
            const slot = this.newSlot("buttonView", null);
            slot.setSlotType("SvButtonView");
        }
        /**
         * @member {SvFlexDomView} rowTextView - The row style's left side: the
         * action's title over its subtitle (hidden in the button style).
         * @category UI
         */
        {
            const slot = this.newSlot("rowTextView", null);
            slot.setSlotType("SvFlexDomView");
        }
        {
            const slot = this.newSlot("rowTitleView", null);
            slot.setSlotType("SvTextView");
        }
        {
            const slot = this.newSlot("rowSubtitleView", null);
            slot.setSlotType("SvTextView");
        }
    }

    /**
     * @description Initializes the SvActionFieldTile.
     * @returns {SvActionFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();

        const cv = this.contentView();
        cv.flexCenterContent();

        const bv = SvButtonView.clone().setElementClassName("SvActionFieldView");
        this.setButtonView(bv);
	    bv.setTarget(this).setAction("didClickButton");
	    bv.setBorder("1px solid rgba(128, 128, 128, 0.5)");
        /*
        bv.setMinWidth("100%");
        bv.setWidth("100%");
        bv.setMaxWidth("100%");

        this.setMinWidth("100%");
        this.setWidth("100%");
        this.setMaxWidth("100%");
        */

        this.setupRowTextView();
        this.addContentSubview(this.buttonView());
        //this.setMinHeightPx(64);

        // Accessibility: action tiles are buttons
        this.setAriaRole("button");

        return this;
    }

    /**
     * @description The row style's title and subtitle, before the button.
     * Hidden until a node asks for the row style (nodeActionStyle); its look
     * is the theme's (field_tiles/_css.css, --sv-action-row-*).
     * @returns {SvActionFieldTile}
     * @category UI
     */
    setupRowTextView () {
        const v = SvFlexDomView.clone().setElementClassName("SvActionRowText");
        v.setDisplay("flex");
        v.setFlexDirection("column");
        v.setFlexGrow(1);
        v.setMinWidth("0px");
        this.setRowTitleView(v.addSubview(SvTextView.clone().setElementClassName("SvActionRowTitle")));
        this.setRowSubtitleView(v.addSubview(SvTextView.clone().setElementClassName("SvActionRowSubtitle")));
        v.setIsDisplayHidden(true);
        this.setRowTextView(v);
        this.addContentSubview(v);
        return this;
    }

    setupTileContentView () {
        super.setupTileContentView();
        const cv = this.contentView();
        cv.setPaddingLeft("0.5em").setPaddingRight("0.5em");
        cv.setPaddingTop("0.5em").setPaddingBottom("0.5em");
        assert(cv.paddingLeft() === "0.5em");
        assert(cv.paddingRight() === "0.5em");
        assert(cv.paddingTop() === "0.5em");
        assert(cv.paddingBottom() === "0.5em");
        // Neutered setters must still return the receiver — callers chain them
        // (see the SvChatMessageTile phantom-tile-padding bug).
        cv.setPaddingLeft = function () { return this; };
        cv.setPaddingRight = function () { return this; };
        cv.setPaddingTop = function () { return this; };
        cv.setPaddingBottom = function () { return this; };
        return this;
    }

    /**
     * @description Updates the subviews of the SvActionFieldTile.
     * @returns {SvActionFieldTile} The updated instance.
     * @category UI
     */
    updateSubviews () {
        super.updateSubviews();

        const node = this.node();
        const bv = this.buttonView();
        if (this.isRowStyle()) {
            this.syncRowFromNode(node);
        } else {
            bv.setTitle(node.translatedValueOfSlotNamed("title"));
            bv.setSubtitle(node.translatedValueOfSlotNamed("subtitle"));
        }
        this.syncStyleAttributes();
        bv.setIsEditable(node.nodeCanEditTitle() && !this.isRowStyle());

        bv.setIsEnabled(node.isEnabled());

        bv.setOpacity(node.isEnabled() || this.isRowStyle() ? 1 : 0.5); // a row's disabled look is the theme's

        const isVisible = this.node().isVisible();
        assert(Type.isBoolean(isVisible));
        //this.setIsVisible(isVisible);
        this.setIsDisplayHidden(!isVisible);


        if (!isVisible) {
            assert(this.isDisplayHidden());
        }

        // Accessibility: label and disabled state
        this.setAriaLabel(this.ariaLabel());
        this.setAriaDisabled(this.ariaIsDisabled());

        return this;
    }

    /**
     * @description Whether the node asks for the row style: its title and
     * subtitle on the left, a compact button with its own short label on
     * the right (SvActionField.nodeActionStyle).
     * @returns {Boolean}
     * @category UI
     */
    isRowStyle () {
        const node = this.node();
        return !!(node && node.nodeActionStyle && node.nodeActionStyle() === "row");
    }

    /**
     * @description Fills the row: the title and subtitle on the left, the
     * button labelled with the node's buttonTitle.
     * @param {SvActionField} node
     * @returns {SvActionFieldTile}
     * @category UI
     */
    syncRowFromNode (node) {
        const subtitle = node.translatedValueOfSlotNamed("subtitle");
        this.rowTitleView().setValue(node.translatedValueOfSlotNamed("title") || "");
        this.rowSubtitleView().setValue(subtitle || "");
        this.rowSubtitleView().setIsDisplayHidden(!subtitle);
        this.buttonView().setTitle(node.buttonTitle());
        this.buttonView().setSubtitle(null);
        return this;
    }

    /**
     * @description The style and state the stylesheet reads: data-action-style
     * ("row" | "button"), and on a row data-destructive and data-disabled.
     * The button's own inline box (border, width, padding) yields to the
     * stylesheet in a row.
     * @returns {SvActionFieldTile}
     * @category UI
     */
    syncStyleAttributes () {
        const node = this.node();
        const isRow = this.isRowStyle();
        this.setAttribute("data-action-style", isRow ? "row" : "button");
        this.setAttribute("data-destructive", isRow && node.isDestructive() ? "true" : "false");
        this.setAttribute("data-disabled", node.isEnabled() ? "false" : "true");
        this.rowTextView().setIsDisplayHidden(!isRow);
        this.contentView().setJustifyContent(isRow ? "space-between" : "center");
        const bv = this.buttonView();
        bv.setBorder(isRow ? null : "1px solid rgba(128, 128, 128, 0.5)");
        bv.setWidth(isRow ? null : "100%");
        return this;
    }

    /**
     * @description Handles the enter key up event.
     * @param {Event} event - The key up event.
     * @returns {boolean} Always returns false.
     * @category Event Handling
     */
    onEnterKeyUp (/*event*/) {
        this.doAction();
        return false;
    }

    /**
     * @description Performs the action associated with this tile.
     * @returns {SvActionFieldTile} The instance.
     * @category Action
     */
    doAction () {
        if (this.node().isEnabled()) { // check in node field?
            this.node().doAction();
        }
        return this;
    }

    /**
     * @description Handles the button click event.
     * @returns {SvActionFieldTile} The instance.
     * @category Event Handling
     */
    didClickButton () {
        this.doAction();
        return this;
    }

    /**
     * @description Synchronizes the tile with its associated node.
     * @returns {SvActionFieldTile} The instance.
     * @category Data Synchronization
     */
    syncToNode () {
        if (!this.isRowStyle()) { // a row's button shows buttonTitle, not the title
            this.node().setTitle(this.buttonView().title());
        }
        super.syncToNode();
        return this;
    }

    /**
     * @description Handles the edit event.
     * @param {View} changedView - The view that was edited.
     * @returns {boolean} Always returns true.
     * @category Event Handling
     */
    onDidEdit (/*changedView*/) {
        this.scheduleSyncToNode();
        //this.node().didUpdateView(this)
        //this.scheduleSyncFromNode() // needed for validation?
        return true;
    }

    // --- ARIA accessibility getters ---

    /**
     * @description Returns the ARIA label from the button title.
     * @returns {string} The ARIA label.
     * @category Accessibility
     */
    ariaLabel () {
        if (this.isRowStyle()) {
            return this.rowTitleView().value() || "";
        }
        return this.buttonView().title() || "";
    }

    /**
     * @description Returns the ARIA disabled state from the node's enabled state.
     * @returns {boolean|null} True if disabled, null if enabled.
     * @category Accessibility
     */
    ariaIsDisabled () {
        const node = this.node();
        return (node && !node.isEnabled()) ? true : null;
    }

}.initThisClass());
