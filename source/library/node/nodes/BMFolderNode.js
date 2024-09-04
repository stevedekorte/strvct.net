"use strict";

/**
 * BMFolderNode
 * 
 * A node that supports adding, reordering, and managing other nodes within the UI.
 * Extends BMSummaryNode.
 */

(class BMFolderNode extends BMSummaryNode {
    
    /**
     * Indicates if this node is available as a node primitive.
     * @returns {boolean} True if available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return true
    }
    
    /**
     * Initializes the prototype slots for the BMFolderNode.
     * These slots are useful for implementing menus.
     */
    initPrototypeSlots () {
        {
            const slot = this.newSlot("label", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("methodName", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("info", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * Initializes the prototype with default settings.
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
     * Initializes the BMFolderNode instance.
     */
    init () {
        super.init()
        this.setNodeCanAddSubnode(true)
        this.setSubnodeClasses(BMNode.primitiveNodeClasses())
    }

    /**
     * Gets the title of the node.
     * @returns {string} The label of the node.
     */
    title () {
        return this.label()
    }

    /**
     * Sets the title of the node.
     * @param {string} aString - The new title to set.
     * @returns {BMFolderNode} The current instance for method chaining.
     */
    setTitle (aString) {
        this.setLabel(aString)
        return this
    }

    /**
     * Gets the accepted subnode types.
     * @returns {Array} An array of accepted field types from BMCreatorNode.
     */
    acceptedSubnodeTypes () {
        return BMCreatorNode.fieldTypes()
    }

    /**
     * Sends the menu action to the target.
     */
    sendMenuAction () {
       const t = this.target()
       const m = this.methodName()
       if (t && m && t[m]) {
           t[m].apply(t, [this])
       }
    }

    /**
     * Handles the tap event on the node.
     * @param {BMNode} aNode - The node that was tapped.
     * @returns {BMFolderNode} The current instance for method chaining.
     */
    onTapOfNode (aNode) {
        super.onTapOfNode()
        this.sendMenuAction()
        return this
    }

    /**
     * Callback for when the parentNode slot is updated.
     * @param {*} oldValue - The old value of the parentNode.
     * @param {*} newValue - The new value of the parentNode.
     */
    didUpdateSlotParentNode (oldValue, newValue) {
        this.scheduleSyncToView()
    }
}.initThisClass());