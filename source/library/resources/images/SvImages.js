

/**
 * @class SvImages
 * @extends SvJsonArrayNode
 * @classdesc An array of SvImages
 */

"use strict";

(class SvImages extends SvJsonArrayNode {

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(true);
        this.setSubnodeClasses([SvImage]);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("images");
    }

}.initThisClass());
