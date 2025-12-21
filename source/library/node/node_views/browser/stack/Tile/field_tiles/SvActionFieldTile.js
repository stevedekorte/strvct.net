/** * @module browser.stack.Tile.field_tiles
 */

/** * @class SvActionFieldTile
 * @extends Tile
 * @classdesc SvActionFieldTile is a specialized Tile class for action fields.
 * It includes a button view and handles user interactions.
 
 
 */

/**

 */

"use strict";

(class SvActionFieldTile extends Tile {

    initPrototypeSlots () {
        /**
         * @member {ButtonView} buttonView - The button view for this action field tile.
         * @category UI
         */
        {
            const slot = this.newSlot("buttonView", null);
            slot.setSlotType("ButtonView");
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

        const bv = ButtonView.clone().setElementClassName("SvActionFieldView");
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

        this.addContentSubview(this.buttonView());
        //this.setMinHeightPx(64);
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
        cv.setPaddingLeft = function () {
            //throw new Error("setPaddingLeft is not allowed");
        };
        cv.setPaddingRight = function () {
            //throw new Error("setPaddingRight is not allowed");
        };
        cv.setPaddingTop = function () {
            //throw new Error("setPaddingTop is not allowed");
        };
        cv.setPaddingBottom = function () {
            //throw new Error("setPaddingBottom is not allowed");
        };
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
        bv.setTitle(node.title());
        bv.setSubtitle(node.subtitle());
        bv.setIsEditable(node.nodeCanEditTitle());

        bv.setIsEnabled(node.isEnabled());

        if (node.isEnabled()) {
            bv.setOpacity(1);
        } else {
            bv.setOpacity(0.5);
        }

        const isVisible = this.node().isVisible();
        assert(Type.isBoolean(isVisible));
        //this.setIsVisible(isVisible);
        this.setIsDisplayHidden(!isVisible);


        if (!isVisible) {
            assert(this.isDisplayHidden());
        }
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
        this.node().setTitle(this.buttonView().title());
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

}.initThisClass());
