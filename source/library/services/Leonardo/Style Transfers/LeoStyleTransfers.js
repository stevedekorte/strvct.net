/**
 * @module library.services.Leonardo.RefImages
 */

"use strict";

/**
 * @class LeoStyleTransfers
 * @extends SvSummaryNode
 * @classdesc Represents a collection of style transfers.
 *
 *
 */

(class LeoStyleTransfers extends SvSummaryNode {

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([LeoStyleTransfer]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setTitle("Style Transfers");
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());
