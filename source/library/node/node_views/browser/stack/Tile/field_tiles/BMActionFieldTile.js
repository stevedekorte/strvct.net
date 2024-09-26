/**
 * @module browser.stack.Tile.field_tiles
 * @class BMActionFieldTile
 * @extends Tile
 * @classdesc BMActionFieldTile is a specialized Tile class for action fields.
 * It includes a button view and handles user interactions.
 */

"use strict";

(class BMActionFieldTile extends Tile {
    
    initPrototypeSlots () {
        /**
         * @member {ButtonView} buttonView - The button view for this action field tile.
         */
        {
            const slot = this.newSlot("buttonView", null);
            slot.setSlotType("ButtonView");
        }
    }

    /**
     * @description Initializes the BMActionFieldTile.
     * @returns {BMActionFieldTile} The initialized instance.
     */
    init () {
        super.init();

        const cv = this.contentView();
        cv.flexCenterContent();
		
        const bv = ButtonView.clone().setElementClassName("BMActionFieldView");
        this.setButtonView(bv);
	    bv.setTarget(this).setAction("didClickButton");
	    bv.setBorder("1px solid rgba(128, 128, 128, 0.5)");

        this.addContentSubview(this.buttonView());
        //this.setMinHeightPx(64);
        return this;
    }

    /**
     * @description Updates the subviews of the BMActionFieldTile.
     * @returns {BMActionFieldTile} The updated instance.
     */
    updateSubviews () {	
        super.updateSubviews()
		
        const node = this.node()
        const bv = this.buttonView()
        bv.setTitle(node.title())
        bv.setSubtitle(node.subtitle())
        bv.setIsEditable(node.nodeCanEditTitle())

        bv.setIsEnabled(node.isEnabled())

        if (node.isEnabled()) {
            bv.setOpacity(1)
        } else {
            bv.setOpacity(0.5)	
        }

        const isVisible = this.node().isVisible();
        assert(Type.isBoolean(isVisible));
        //this.setIsVisible(isVisible);
        this.setIsDisplayHidden(!isVisible);


        if (!isVisible) {
            assert(this.isDisplayHidden())
        }
        return this
    }
    
    /**
     * @description Handles the enter key up event.
     * @param {Event} event - The key up event.
     * @returns {boolean} Always returns false.
     */
    onEnterKeyUp (event) {
        this.doAction()
        return false
    }
    
    /**
     * @description Performs the action associated with this tile.
     * @returns {BMActionFieldTile} The instance.
     */
    doAction () {
        if (this.node().isEnabled()) { // check in node field?
            this.node().doAction()
        }
        return this     
    }
    
    /**
     * @description Handles the button click event.
     * @returns {BMActionFieldTile} The instance.
     */
    didClickButton () {
        this.doAction()
        return this
    }

    /**
     * @description Synchronizes the tile with its associated node.
     * @returns {BMActionFieldTile} The instance.
     */
    syncToNode () {
        this.node().setTitle(this.buttonView().title()) 
        super.syncToNode()
        return this
    }

    /**
     * @description Handles the edit event.
     * @param {View} changedView - The view that was edited.
     * @returns {boolean} Always returns true.
     */
    onDidEdit (changedView) {     
        this.scheduleSyncToNode()
        //this.node().didUpdateView(this)
        //this.scheduleSyncFromNode() // needed for validation?
        return true
    }
    
}.initThisClass());