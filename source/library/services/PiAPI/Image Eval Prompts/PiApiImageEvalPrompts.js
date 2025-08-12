/**
 * @module library.services.PiAPI.ImageEvalPrompts
 */

"use strict";

/**
 * @class PiApiImageEvalPrompts
 * @extends SvSummaryNode
 * @classdesc Collection of PiAPI image evaluation prompts.
 * 
 * Manages a collection of prompts that generate multiple images via Midjourney
 * and then evaluate them with OpenAI to select the best match.
 */

(class PiApiImageEvalPrompts extends SvSummaryNode {

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([PiApiImageEvalPrompt]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setTitle("Image Eval Prompts");
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.setNodeFillsRemainingWidth(false);
    }

}.initThisClass());