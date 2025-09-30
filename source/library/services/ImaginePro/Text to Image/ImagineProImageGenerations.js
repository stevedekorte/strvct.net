/**
 * @module library.services.ImaginePro.Text_to_Image
 */

/**
 * @class ImagineProImageGenerations
 * @extends SvJsonArrayNode
 * @classdesc A collection of ImaginePro image generation tasks.
 */
"use strict";

(class ImagineProImageGenerations extends SvSummaryNode {

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(true);
        this.setSubnodeClasses([ImagineProImageGeneration]);
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
