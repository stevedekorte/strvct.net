/**
 * @module library.image
 */

/**
 * @class SvImageMosaics
 * @extends SvSummaryNode
 * @classdesc An array of SvImageMosaics
 */

"use strict";

(class SvImageMosaics extends SvSummaryNode {


    initPrototypeSlots () {

    }

    initPrototype () {
        this.setTitle("Mosaics");
        this.setSubtitle("image mosaic testing");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([SvImageMosaic]);
        this.setNoteIsSubnodeCount(true);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());
