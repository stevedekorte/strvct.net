"use strict";

/**
 * @module library.services.Spatial
 */

/**
 * @class SpatialModelNode
 * @extends SvStorableNode
 * @classdesc Represents a spatial model node for 3D models.
 */
(class SpatialModelNode extends SvStorableNode {

    /**
     * @description Initializes the prototype slots for the SpatialModelNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {string|null} dataURL - The URL of the 3D model data.
         * @category Data
         */
        {
            const slot = this.newSlot("dataURL", null);
            slot.setShouldStoreSlot(true);
        }
    }

    /**
     * @description Initializes the prototype with default values and settings.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle("Untitled 3d Model");
        this.setSubtitle(null);
        this.setCanDelete(true);

        this.setNodeTileClassName(SceneViewWellFieldTile);
    }

    /**
     * @description Initializes the SpatialModelNode.
     * @category Initialization
     */
    init () {
        super.init();
    }

    /**
     * @description Handles the event when the node is edited.
     * @category Event Handling
     */
    onDidEditNode () {
        this.logDebug(" onDidEditNode");
    }


}.initThisClass());
