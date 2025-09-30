/**
 * @module library.services.OpenAI.ImageEvaluators
 */

"use strict";

/**
 * @class OpenAiImageEvaluators
 * @extends SvSummaryNode
 * @classdesc Collection of OpenAI image evaluators.
 *
 * Manages a collection of image evaluation operations that score
 * images based on how well they match a given content prompt.
 */

(class OpenAiImageEvaluators extends SvSummaryNode {

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([OpenAiImageEvaluator]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setTitle("Image Evaluators");
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.setNodeFillsRemainingWidth(false);
    }

}.initThisClass());
