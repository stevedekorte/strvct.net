"use strict";

/**
 * @module library.node.nodes
 * @class BMImageNode
 * @extends BMStorableNode
 * @classdesc BMImageNode class for handling image nodes.
 */
(class BMImageNode extends BMStorableNode {
    
    /**
     * @description Initializes the prototype slots for the BMImageNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {String} dataURL - The data URL of the image.
             * @category Data
             */
            const slot = this.newSlot("dataURL", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype with default settings.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle("Untitled");
        this.setSubtitle(null);
        this.setCanDelete(true);
        this.setNodeCanAddSubnode(true);
    }

    /**
     * @description Handles the event when the node is edited.
     * @category Event Handling
     */
    onDidEditNode () {
        this.debugLog(" onDidEditNode")
    }

    /**
     * @description Creates a JSON archive of the node.
     * @returns {undefined}
     * @category Data Serialization
     */
    jsonArchive () {
        debugger;
        return undefined;
    }
    
}.initThisClass());