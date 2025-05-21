/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class SvVideoWellFieldTile
 * @extends SvFieldTile
 * @classdesc Represents a video well field tile in the browser stack.
 */
"use strict";

(class SvVideoWellFieldTile extends SvFieldTile {
    
    /**
     * @description Checks if the given mime type can be opened.
     * @param {string} mimeType - The mime type to check.
     * @returns {boolean} True if the mime type can be opened, false otherwise.
     * @category File Handling
     */
    canOpenMimeType (mimeType) {
        return mimeType.startsWith("video/");
    }

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvVideoWellFieldTile.
     * @returns {SvVideoWellFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.valueViewContainer().flexCenterContent();
        this.valueViewContainer().setPaddingTop("0px").setPaddingBottom("0px");
        this.valueView().setPaddingTop("0px").setPaddingBottom("0px");

        this.turnOffUserSelect();
        this.keyView().setTransition("color 0.3s");
        return this;
    }

    /**
     * @description Creates and returns a value view.
     * @returns {VideoWellView} The created video well view.
     * @category View Creation
     */
    createValueView () {
        /*
            Note: if we drop a video on the VideoWellView, it will send a didUpdateVideoWellView to it's parents
            which we respond to and use to call setValue
        */
        const videoWellView = VideoWellView.clone();
        return videoWellView;
    }

    setDataUrl (dataUrl) {
        this.setValue(dataUrl);
        return this;
    }
	
    /**
     * @description Returns the video well view.
     * @returns {VideoWellView} The video well view.
     * @category View Access
     */
    videoWellView () {
        return this.valueView();
    }

    /**
     * @description Synchronizes the tile from the node.
     * @returns {SvVideoWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode();

        const field = this.node();
        this.setMaxWidth("100em"); // get this from node instead?
        
        this.applyStyles(); // normally this would happen in updateSubviews
        this.videoWellView().setVideoDataUrl(field.value());
        this.videoWellView().setIsEditable(field.valueIsEditable());

        return this;
    }

    /**
     * @description Synchronizes the tile to the node.
     * @returns {SvVideoWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncToNode () {
        const field = this.node();
				
        field.setKey(this.keyView().value());

        if (field.valueIsEditable()) {
            const data = this.videoWellView().videoDataUrl();
            field.setValue(data);
        }
        
        return this;
    }

    /**
     * @description Returns the data URL of the video.
     * @returns {string|null} The data URL of the video.
     * @category Data Access
     */
    dataUrl () {
        return this.videoWellView().videoDataUrl();
    }

    /**
     * @description Checks if the video well is empty.
     * @returns {boolean} True if empty, false otherwise.
     * @category State Check
     */
    isEmpty () {
        return Type.isNull(this.dataUrl());
    }
    
    /**
     * @description Handles the update of the video well view.
     * @param {VideoWellView} aVideoWell - The updated video well view.
     * @returns {SvVideoWellFieldTile} The current instance.
     * @category Event Handling
     */
    didUpdateVideoWellView (/*aVideoWell*/) {
        this.scheduleSyncToNode();
        return this;
    }
    
}.initThisClass());