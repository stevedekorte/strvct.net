/**
 * @module library.services.Spatial
 */

"use strict";

/**
 * @class SceneViewWellFieldTile
 * @extends BMFieldTile
 * @classdesc SceneViewWellFieldTile class for handling scene view well fields.
 */
(class SceneViewWellFieldTile extends BMFieldTile {
    
    /**
     * @description Checks if the given MIME type can be opened.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the MIME type can be opened, false otherwise.
     * @category File Handling
     */
    canOpenMimeType (mimeType) {
        // TODO: add checks for browser supported image types?
        return mimeType.startsWith("model/")
    }

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {Class} dataViewClass
             * @category View
             */
            const slot = this.newSlot("dataViewClass", SceneView);
            slot.setSlotType("Class");
        }
    }

    /**
     * @description Initializes the SceneViewWellFieldTile instance.
     * @returns {SceneViewWellFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.valueViewContainer().flexCenterContent();
        this.valueViewContainer().setPaddingTop("0px").setPaddingBottom("0px");
        this.valueView().setPaddingTop("0px").setPaddingBottom("0px");

        //this.keyView().setElementClassName("BMImageWellKeyField");
        //this.valueView().setIsEditable(false);
        this.turnOffUserSelect();
        this.keyView().setTransition("color 0.3s");
        //this.valueViewContainer().setPadding("0px");
        return this;
    }

    /**
     * @description Creates the value view for the SceneViewWellFieldTile.
     * @returns {Object} The created value view instance.
     * @category View
     */
    createValueView () {
        const instance = this.dataViewClass().clone();
        //instance.setWidth("100%").setHeight("fit-content");
        return instance;
    }

    /**
     * @description Synchronizes the SceneViewWellFieldTile with its node.
     * @returns {SceneViewWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode()

        const field = this.node()
        this.setMaxWidth("100em") // get this from node instead?
        
        this.applyStyles() // normally this would happen in updateSubviews
        this.valueView().setDataUrl(field.value())
        this.valueView().setIsEditable(field.valueIsEditable())

        return this
    }

    /**
     * @description Synchronizes the SceneViewWellFieldTile to its node.
     * @returns {SceneViewWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncToNode () {
        const field = this.node()
				
        //this.updateKeyView()
        
        field.setKey(this.keyView().value())

        if (field.valueIsEditable()) {
            const data = this.valueView().dataUrl()
            //console.log("data = " + (data ? data.slice(0, 40) + "..." : "null"))
        	field.setValue(data)
        }
        
        //super.suncToNode()
        return this
    }

    /**
     * @description Gets the data URL of the value view.
     * @returns {string|null} The data URL of the value view.
     * @category Data
     */
    dataUrl () {
        return this.valueView().dataUrl()
    }

    /**
     * @description Checks if the SceneViewWellFieldTile is empty.
     * @returns {boolean} True if empty, false otherwise.
     * @category State
     */
    isEmpty () {
        return Type.isNull(this.dataUrl())
    }
    
    /*
    didUpdateImageWellView (anImageWell) {
        //this.debugLog(".didUpdateImageWellView()")
        this.scheduleSyncToNode() 
        return this
    }
    */
    
}.initThisClass());