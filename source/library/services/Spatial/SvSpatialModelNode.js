/**
 * @module library.services.Spatial
 */

/**
 * @class SvSpatialModelNode
 * @extends SvStorableNode
 * @classdesc Represents a 3D model node in a spatial context.
 */
(class SvSpatialModelNode extends SvStorableNode {

    /**
     * @description Initializes the prototype slots for the SvSpatialModelNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {string|null} dataURL - The URL of the 3D model data.
             * @category Data
             */
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

        this.setNodeTileClassName(SvSceneViewWellFieldTile);
    }

    /**
     * @description Initializes the SvSpatialModelNode.
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
