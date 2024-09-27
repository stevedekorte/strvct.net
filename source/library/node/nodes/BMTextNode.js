/**
 * @module library.node.nodes
 * @class BMTextNode
 * @extends BMStorableNode
 * @classdesc A node that contains Text, stores its:
 *    content, color, font, padding, margin
 *    and has an inspector for these attributes
 */
"use strict";

(class BMTextNode extends BMStorableNode {
    /**
     * @static
     * @description Indicates if this node is available as a node primitive
     * @returns {boolean} True if available as a node primitive
     */
    static availableAsNodePrimitive () {
        return true
    }

    /**
     * @description Initializes the prototype slots for the BMTextNode
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
         */
        {
            const slot = this.newSlot("value", "...")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("value")
            slot.setSyncsToView(true)
            //slot.setInspectorPath("Style")
        }
    }

    /**
     * @description Initializes the prototype of the BMTextNode
     */
    initPrototype () {
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setCanDelete(true)
        this.setNodeCanInspect(true)

        this.setTitle("title")
        this.setNodeCanEditTitle(true)
        
        this.setNodeCanReorderSubnodes(true)
  
        this.setNodeCanEditTileHeight(true)
        this.setNodeCanEditColumnWidth(true)
    }

    /**
     * @description Returns the accepted subnode types for this node
     * @returns {Array} An empty array as this node does not accept subnodes
     */
    acceptedSubnodeTypes () {
        return [];
    }

}.initThisClass());