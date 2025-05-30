/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class SvImageWellFieldTile
 * @extends SvFieldTile
 * @classdesc Represents an image well field tile in the browser stack.
 */
"use strict";

(class SvImageWellFieldTile extends SvFieldTile {
    
    /**
     * @description Checks if the given mime type can be opened.
     * @param {string} mimeType - The mime type to check.
     * @returns {boolean} True if the mime type can be opened, false otherwise.
     * @category File Handling
     */
    canOpenMimeType (mimeType) {
        // TODO: add checks for browser supported image types?
        return mimeType.startsWith("image/");
    }

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvImageWellFieldTile.
     * @returns {SvImageWellFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.valueViewContainer().flexCenterContent();
        this.valueViewContainer().setPaddingTop("0px").setPaddingBottom("0px");
        this.valueView().setPaddingTop("0px").setPaddingBottom("0px");

        //this.keyView().setElementClassName("SvImageWellKeyField");
        //this.valueView().setIsEditable(false);
        this.turnOffUserSelect();
        this.keyView().setTransition("color 0.3s");
        //this.valueViewContainer().setPadding("0px");
        return this;
    }

    /**
     * @description Creates and returns a value view.
     * @returns {ImageWellView} The created image well view.
     * @category View Creation
     */
    createValueView () {
        /*
            Note: if we drop an image on the ImageWellView, it will send a didUpdateImageWellView to it's parents
            which we respond to and use to call setValue
        */
        const imageWellView = ImageWellView.clone();
        //imageWellView.setWidth("100%").setHeight("fit-content");
        return imageWellView;
    }

    setDataUrl (dataUrl) {
        debugger;
        this.setValue(dataUrl);
        return this;
    }
	
    /**
     * @description Returns the image well view.
     * @returns {ImageWellView} The image well view.
     * @category View Access
     */
    imageWellView () {
        return this.valueView();
    }

    /**
     * @description Synchronizes the tile from the node.
     * @returns {SvImageWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode();

        const field = this.node();
        this.setMaxWidth("100em"); // get this from node instead?
        
        this.applyStyles(); // normally this would happen in updateSubviews
        this.imageWellView().setImageDataUrl(field.value());
        this.imageWellView().setIsEditable(field.valueIsEditable());

        // Hide the value view if we're still generating (showing dots in key)
        if (field.keyIsComplete && !field.keyIsComplete()) {
            this.valueViewContainer().setDisplay("none");
        } else {
            this.valueViewContainer().setDisplay("");
        }

        return this;
    }

    /**
     * @description Synchronizes the tile to the node.
     * @returns {SvImageWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncToNode () {
        const field = this.node();
				
        //this.updateKeyView();
        
        field.setKey(this.keyView().value());

        if (field.valueIsEditable()) {
            const data = this.imageWellView().imageDataUrl();
            //console.log("data = " + (data ? data.slice(0, 40) + "..." : "null"));
            field.setValue(data);
        }
        
        //super.suncToNode();
        return this;
    }

    /**
     * @description Returns the data URL of the image.
     * @returns {string|null} The data URL of the image.
     * @category Data Access
     */
    dataUrl () {
        return this.imageWellView().imageDataUrl();
    }

    /**
     * @description Checks if the image well is empty.
     * @returns {boolean} True if empty, false otherwise.
     * @category State Check
     */
    isEmpty () {
        return Type.isNull(this.dataUrl());
    }
    
    /**
     * @description Handles the update of the image well view.
     * @param {ImageWellView} anImageWell - The updated image well view.
     * @returns {SvImageWellFieldTile} The current instance.
     * @category Event Handling
     */
    didUpdateImageWellView (/*anImageWell*/) {
        //this.debugLog(".didUpdateImageWellView()");
        this.scheduleSyncToNode();
        return this;
    }
    
}.initThisClass());