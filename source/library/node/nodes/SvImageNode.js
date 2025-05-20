"use strict";

/**
 * @module library.node.nodes
 * @class SvImageNode
 * @extends SvStorableNode
 * @classdesc SvImageNode class for handling image nodes.
 */
(class SvImageNode extends SvStorableNode {
    
    /**
     * @description Initializes the prototype slots for the SvImageNode.
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
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            // SvImageWellField
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
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.setNodeViewClassName("ImageWellView");
    }
    
    /**
     * @description Handles the event when the node is edited.
     * @category Event Handling
     */
    onDidEditNode () {
        this.debugLog(" onDidEditNode");
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

    key () {
        return this.title();
    }

    value () {
        debugger;
        return this.dataURL();
    }

    setValue (value) {
        debugger;
        this.setDataURL(value);
        return this;
    }
    
}.initThisClass());