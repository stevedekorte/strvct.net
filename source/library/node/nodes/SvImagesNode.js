/**
 * @module library.node.nodes
 * @class SvImagesNode
 * @extends SvStorableNode
 * @classdesc Represents a node for managing image resources.
 */
(class SvImagesNode extends SvStorableNode {

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
        this.setNodeViewClassName("SvImageView");
        this.setSubnodeProto("SvImageNode");
        this.setSubnodeClasses([SvImageNode]);

        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle("Images");
        this.setSubtitle(null);

        this.setNodeCanAddSubnode(true);
        //this.setCanDelete(true)
    }

    async asyncImageObjects () {
        return await Promise.all(this.subnodes().map(node => node.asyncImageObject()));
    }

}.initThisClass());
