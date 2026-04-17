/** * @module library.app
 */

/** * @class SvBreadCrumbsNode
 * @extends SvFolderNode
 * @classdesc SvBreadCrumbsNode is a class that extends SvFolderNode and represents a breadcrumb node.
 
 
 */

/**

 */
"use strict";

(class SvBreadCrumbsNode extends SvFolderNode {
    /**
     * Initializes the prototype slots of the SvBreadCrumbsNode class.
     * @description This method is used to initialize the prototype slots of the SvBreadCrumbsNode class.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * Initializes the prototype of the SvBreadCrumbsNode class.
     * @description This method is used to initialize the prototype of the SvBreadCrumbsNode class.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeTileClassName("SvBreadCrumbsTile");
        this.setCanDelete(false);
        this.setNodeMinTileHeight(55);
        this.setNodeCanReorderSubnodes(false);
        this.setNodeIsVertical(false);
        this.setNodeCanAddSubnode(false);
        this.setTitle("bread crumbs");
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());
