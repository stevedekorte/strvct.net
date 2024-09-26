/**
 * @module library.node.nodes
 * @class BMLinkNode
 * @extends BMSummaryNode
 * @classdesc A node that represents a link to another node, which is not a subnode
 */
"use strict";

(class BMLinkNode extends BMSummaryNode {
    
    /**
     * @static
     * @description Indicates if this node is available as a primitive
     * @returns {boolean} True if available as a node primitive
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @description Initializes the prototype slots for the BMLinkNode
     */
    initPrototypeSlots () {
        /**
         * @member {BMNode} linkedNode
         * @description The node that this link points to
         */
        {
            const slot = this.newSlot("linkedNode", null);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("BMNode");
        }
        
        /**
         * @member {boolean} willDuplicateLinkedObject
         * @description Indicates if the linked object should be duplicated when this node is duplicated
         */
        {
            const slot = this.newSlot("willDuplicateLinkedObject", false);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("Will duplicate linked object");
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype of the BMLinkNode
     */
    initPrototype () {
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setCanDelete(true)
        this.setNodeCanInspect(true)
        this.setNodeCanEditTitle(true)

        this.setCanDelete(true)
        this.setNodeCanInspect(true) 
    }

    /*
    init () {
        super.init()
    }
    */

    /*
    didUpdateSlotLinkedNode (oldValue, newValue) {
        assert(Type.isNull(newValue) || Type.isObject(newValue));

        if (Type.isObject(newValue)) {
            const isNode = newValue.thisClass().isKindOf(BMNode);
            assert(isNode);
        }

        debugger;
        return this
    }
    */

    /**
     * @description Checks if this node accepts a drop of another node
     * @param {BMNode} aNode - The node being dropped
     * @returns {boolean} True if the node accepts the drop
     */
    nodeAcceptsDrop (aNode) {
        return true
    }

    /**
     * @description Handles the event when a node is dropped onto this node
     * @param {BMNode} aNode - The node that was dropped
     */
    nodeDropped (aNode) {
        this.setLinkedNode(aNode)
    }

    /**
     * @description Creates a duplicate of this node
     * @returns {BMLinkNode} The duplicated node
     */
    duplicate () {
        const obj = super.duplicate()
        if (this.willDuplicateLinkedObject()) {
            const ln = this.linkedNode()
            if (ln) {
                obj.setLinkedNode(ln.duplicate())
            }
        }
        return obj
    }

    /**
     * @description Gets the title of the node
     * @returns {string} The title of the linked node or "Unlinked" if no node is linked
     */
    title () {
        const ln = this.linkedNode()
        if (ln) {
            return ln.title()
        }
        return "Unlinked"
    }

    /*
    setTitle (s) {
        const ln = this.linkedNode()
        if (ln) {
            return ln.setTitle(s)
        }
        return this   
    }
    */

    /**
     * @description Gets the subtitle of the node
     * @returns {string} The subtitle of the linked node or a default message if no node is linked
     */
    subtitle () {
        const ln = this.linkedNode()
        if (ln) {
            return ln.subtitle()
        }
        return "drop tile to link"    
    }

    /*
    title () {
        if (Type.isNull(super.title()) && this.linkedNode()) {
            return this.linkedNode().title()
        }

        return super.title()
    }
    */

    /**
     * @description Gets the accepted subnode types for this node
     * @returns {Array} An empty array as this node doesn't accept subnodes
     */
    acceptedSubnodeTypes () { 
        // TODO: have browser use nodeTileLink for this protocol?
        return []
    }
    
    /**
     * @description Gets the note of the linked node
     * @returns {string|null} The note of the linked node or null if no node is linked
     */
    note () {
        if (this.linkedNode()) {
            return this.linkedNode().note()
        }

        return null
    }

    /**
     * @description Gets the note icon name
     * @returns {string|null} The note icon name (currently always null)
     */
    noteIconName () {
        //return this.nodeTileLink() ? "double right caret" : null
        return null
    }

    /**
     * @description Gets the linked node
     * @returns {BMNode|null} The linked node
     */
    nodeTileLink () {
        return this.linkedNode()
    }

    /**
     * @description Checks if the linked node can reorder subnodes
     * @returns {boolean} True if the linked node can reorder subnodes, false otherwise
     */
    nodeCanReorderSubnodes () {
        const ln = this.linkedNode()
        return ln ? ln.nodeCanReorderSubnodes() : false // have this operation done in the browser?
    }

    /**
     * @description Adds a subnode at a specific index
     * @param {BMNode} aSubnode - The subnode to add
     * @param {number} anIndex - The index at which to add the subnode
     * @returns {BMLinkNode} This node instance
     */
    addSubnodeAt (aSubnode, anIndex) {
        return super.addSubnodeAt(aSubnode, anIndex)
    }

}.initThisClass());