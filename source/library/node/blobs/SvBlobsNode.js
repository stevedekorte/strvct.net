
"use strict";

/** * @module library.node.blobs
 */

/** * @class SvBlobsNode
 * @extends SvStorableNode
 * @classdesc A container for SvBlobNode subnodes.
 
 
 */

/**

 */

(class SvBlobsNode extends SvStorableNode {

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype properties for the class.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Blobs");
        this.setSubnodeClasses([SvBlobNode]);
        this.setNoteIsSubnodeCount(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanReorderSubnodes(false);
    }


}.initThisClass());
