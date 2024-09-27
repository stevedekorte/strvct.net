/**
 * @module library.node.nodes
 */

"use strict";

/**
 * @class BMFolderNode
 * @extends BMSummaryNode
 * @classdesc A node that supports adding, reordering, and managing other nodes within the UI.
 * Extends BMSummaryNode.
 */
(class BMFolderNode extends BMSummaryNode {
    
    /**
     * @static
     * @description Indicates if this node is available as a node primitive.
     * @returns {boolean} True if available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return true
    }
    
    /**
     * @description Initializes the prototype slots for the BMFolderNode.
     * These slots are useful for implementing menus.
     */
    initPrototypeSlots () {
        /**
         * @member {string} label
         * @description The label of the folder node.
         */
        {
            const slot = this.newSlot("label", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
        /**
         * @member {Object} target
         * @description The target object for the folder node.
         */
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
        }
        /**
         * @member {string} methodName
         * @description The method name to be called on the target.
         */
        {
            const slot = this.newSlot("methodName", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Object} info
         * @description Additional information for the folder node.
         */
        {
            const slot = this.newSlot("info", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * @description Initializes the prototype with default settings.
     */
    initPrototype () {
        this.setCanDelete(true);
        this.setNodeCanInspect(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setTitle("title");
        this.setNodeCanEditTitle(true);
        
        this.setNodeCanReorderSubnodes(true);
        this.setNodeCanInspect(true);
        //this.setNoteIconName("right-arrow");
    }

    /**
     * @description Initializes the BMFolderNode instance.
     */
    init () {
        super.init()
        this.setNodeCanAddSubnode(true)
        this.setSubnodeClasses(BMNode.primitiveNodeClasses())
    }

    /**
     * @description Gets the title of the node.
     * @returns {string} The label of the node.
     */
    title () {
        return this.label()
    }

    /**
     * @description Sets the title of the node.
     * @param {string} aString - The new title to set.
     * @returns {BMFolderNode} The current instance for method chaining.
     */
    setTitle (aString) {
        this.setLabel(aString)
        return this
    }

    /**
     * @description Gets the accepted subnode types.
     * @returns {Array} An array of accepted field types from BMCreatorNode.
     */
    acceptedSubnodeTypes () {
        return BMCreatorNode.fieldTypes()
    }

    /**
     * @description Sends the menu action to the target.
     */
    sendMenuAction () {
       const t = this.target()
       const m = this.methodName()
       if (t && m && t[m]) {
           t[m].apply(t, [this])
       }
    }

    /**
     * @description Handles the tap event on the node.
     * @param {BMNode} aNode - The node that was tapped.
     * @returns {BMFolderNode} The current instance for method chaining.
     */
    onTapOfNode (aNode) {
        super.onTapOfNode()
        this.sendMenuAction()
        return this
    }

    /**
     * @description Callback for when the parentNode slot is updated.
     * @param {*} oldValue - The old value of the parentNode.
     * @param {*} newValue - The new value of the parentNode.
     */
    didUpdateSlotParentNode (oldValue, newValue) {
        this.scheduleSyncToView()
    }
}.initThisClass());