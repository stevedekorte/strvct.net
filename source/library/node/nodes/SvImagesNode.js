/**
 * @module library.node.nodes
 * @class SvImageResourcesNode
 * @extends SvStorableNode
 * @classdesc Represents a node for managing image resources.
 */
(class SvImageResourcesNode extends SvStorableNode {

    /**
     * @description Initializes the prototype slots for the node.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the node.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeViewClassName("ImageView");
        this.setSubnodeProto("ImageNode");

        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle(null);
        this.setSubtitle(null);

        //this.setNodeCanAddSubnode(true);
        //this.setCanDelete(true)
    }

}.initThisClass());
