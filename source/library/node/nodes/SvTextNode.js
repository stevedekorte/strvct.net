/**
 * @module library.node.nodes
 * @class SvTextNode
 * @extends SvStorableNode
 * @classdesc A node that contains Text, stores its:
 *    content, color, font, padding, margin
 *    and has an inspector for these attributes
 */
"use strict";

(class SvTextNode extends SvStorableNode {
    /**
     * @static
     * @description Indicates if this node is available as a node primitive
     * @returns {boolean} True if available as a node primitive
     * @category Node Configuration
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @description Initializes the prototype slots for the SvTextNode
     * @category Initialization
     */
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("nodeUrlLink", "")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("URL")
            //slot.setSyncsToView(true)
            //slot.setInspectorPath("Style")
        }
        */

        /**
         * @member {string} value
         * @description The text content of the node
         * @category Content
         */
        {
            const slot = this.newSlot("value", "...");
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setLabel("value");
            slot.setSyncsToView(true);
            //slot.setInspectorPath("Style")
        }
    }

    /**
     * @description Initializes the prototype of the SvTextNode
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(true);
        this.setNodeCanInspect(true);

        this.setTitle("title");
        this.setNodeCanEditTitle(true);

        this.setNodeCanReorderSubnodes(true);

        this.setNodeCanEditTileHeight(true);
        this.setNodeCanEditColumnWidth(true);
    }

    /**
     * @description Returns the accepted subnode types for this node
     * @returns {Array} An empty array as this node does not accept subnodes
     * @category Node Configuration
     */
    acceptedSubnodeTypes () {
        return [];
    }

}.initThisClass());
