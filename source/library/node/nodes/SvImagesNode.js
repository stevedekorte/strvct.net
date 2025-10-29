/**
 * @module library.node.nodes
 * @class SvImagesNode
 * @extends SvStorableNode
 * @classdesc Represents a node for managing image resources.
 */
(class SvImagesNode extends SvStorableNode {

    static canOpenMimeType (mimeType) {
        return mimeType.startsWith("image/");
    }

    /**
     * @static
     * @description Creates a new SvImageNode from a dropped data chunk.
     * @param {Object} dataChunk - The dropped data chunk containing image data.
     * @returns {SvImageNode} A new SvImageNode with the dropped image data.
     * @category MIME Handling
     */
    static openMimeChunk (dataChunk) {
        const newNode = SvImageNode.clone();
        newNode.setDataURL(dataChunk.dataUrl());
        return newNode;
    }

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
