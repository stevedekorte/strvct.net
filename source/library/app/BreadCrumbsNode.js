/**
 * @module library.app
 * @class BreadCrumbsNode
 * @extends SvFolderNode
 * @classdesc BreadCrumbsNode is a class that extends SvFolderNode and represents a breadcrumb node.
 */
"use strict";

(class BreadCrumbsNode extends SvFolderNode {
    /**
     * Initializes the prototype slots of the BreadCrumbsNode class.
     * @description This method is used to initialize the prototype slots of the BreadCrumbsNode class.
     * @category Initialization
     */
    initPrototypeSlots() {
        /*
        {
            const slot = this.newSlot("blobs", null)
            slot.setFinalInitProto(SvBlobs)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
        }
        */
    }

    /**
     * Initializes the prototype of the BreadCrumbsNode class.
     * @description This method is used to initialize the prototype of the BreadCrumbsNode class.
     * @category Initialization
     */
    initPrototype() {
        this.setNodeTileClassName("BreadCrumbsTile");
        this.setCanDelete(false);
        this.setNodeMinTileHeight(55);
        this.setNodeCanReorderSubnodes(false);
        this.setNodeIsVertical(true);
        this.setNodeCanAddSubnode(false);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("bread crumbs");
    };

}.initThisClass());