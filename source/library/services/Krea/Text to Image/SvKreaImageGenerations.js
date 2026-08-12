/**
 * @module library.services.Krea.Text_to_Image
 */

/**
 * @class SvKreaImageGenerations
 * @extends SvSummaryNode
 * @classdesc A collection of Krea image generation jobs.
 */
"use strict";

(class SvKreaImageGenerations extends SvSummaryNode {

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(true);
        this.setSubnodeClasses([SvKreaImageGeneration]);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
        this.setNodeSubtitleIsChildrenSummary(true);
    }

    /**
     * @description Performs final initialization.
     * @category Initialization
     */
    finalInit () {
        super.finalInit();
        this.setTitle("generations");
    }

}.initThisClass());
