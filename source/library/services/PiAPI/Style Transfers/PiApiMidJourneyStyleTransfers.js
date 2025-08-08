/**
 * @module library.services.PiAPI.StyleTransfers
 */

"use strict";

/**
 * @class PiApiMidJourneyStyleTransfers
 * @extends SvSummaryNode
 * @classdesc Represents a collection of Midjourney style transfers via PiAPI.
 */

(class PiApiMidJourneyStyleTransfers extends SvSummaryNode {

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([PiApiMidJourneyStyleTransfer]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setTitle("Midjourney Style Transfers");
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());