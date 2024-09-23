"use strict";

/**
 * @module library.services.Spatial
 */

/**
 * @class SpatialModelNode
 * @extends BMStorableNode
 * @classdesc Represents a spatial model node for 3D models.
 */
(class SpatialModelNode extends BMStorableNode {
    
    /**
     * @description Initializes the prototype slots for the SpatialModelNode.
     */
    initPrototypeSlots () {
        /**
         * @property {string|null} dataURL - The URL of the 3D model data.
         */
        {
            const slot = this.newSlot("dataURL", null)
            slot.setShouldStoreSlot(true)
        }
    }

    /**
     * @description Initializes the prototype with default values and settings.
     */
    initPrototype () {
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setTitle("Untitled 3d Model")
        this.setSubtitle(null)
        this.setCanDelete(true)

        this.setNodeTileClassName(SceneViewWellFieldTile);
    }

    /**
     * @description Initializes the SpatialModelNode.
     */
    init () {
        super.init()
    }
    
    /**
     * @description Handles the event when the node is edited.
     */
    onDidEditNode () {
        this.debugLog(" onDidEditNode")
    }

    /**
     * @description Creates a JSON archive of the SpatialModelNode.
     * @returns {undefined}
     */
    jsonArchive () {
        debugger;
        return undefined;
    }
    
}.initThisClass());