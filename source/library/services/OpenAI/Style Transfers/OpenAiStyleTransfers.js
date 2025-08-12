/**
 * @module library.services.OpenAI.StyleTransfers
 */

"use strict";

/**
 * @class OpenAiStyleTransfers
 * @extends SvSummaryNode
 * @classdesc Collection of OpenAI style transfers.
 * 
 * Manages a collection of OpenAI style transfer operations that use
 * OpenAI's style reference image capability to apply artistic styles
 * to generated images.
 */

(class OpenAiStyleTransfers extends SvSummaryNode {

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([OpenAiStyleTransfer]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setTitle("Style Transfers");
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.setNodeFillsRemainingWidth(false);
    }

}.initThisClass());