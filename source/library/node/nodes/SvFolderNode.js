/**
 * @module library.node.nodes
 */

"use strict";

/**
 * @class SvFolderNode
 * @extends SvSummaryNode
 * @classdesc A node that supports adding, reordering, and managing other nodes within the UI.
 * Extends SvSummaryNode.
 */
(class SvFolderNode extends SvSummaryNode {

    /**
     * @static
     * @description Indicates if this node is available as a node primitive.
     * @returns {boolean} True if available as a node primitive.
     * @category Node Properties
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @description Initializes the prototype slots for the SvFolderNode.
     * These slots are useful for implementing menus.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {string} label
         * @description The label of the folder node.
         * @category Node Properties
         */
        {
            const slot = this.newSlot("label", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
        }
        /**
         * @member {Object} target
         * @description The target object for the folder node.
         * @category Node Properties
         */
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
        }
        /**
         * @member {string} methodName
         * @description The method name to be called on the target.
         * @category Node Properties
         */
        {
            const slot = this.newSlot("methodName", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Object} info
         * @description Additional information for the folder node.
         * @category Node Properties
         */
        {
            const slot = this.newSlot("info", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * @description Initializes the prototype with default settings.
     * @category Initialization
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
     * @description Initializes the SvFolderNode instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setNodeCanAddSubnode(true);
        this.setSubnodeClasses(SvNode.primitiveNodeClasses());
    }

    /**
     * @description Gets the title of the node.
     * @returns {string} The label of the node.
     * @category Node Properties
     */
    title () {
        return this.label();
    }

    /**
     * @description Sets the title of the node.
     * @param {string} aString - The new title to set.
     * @returns {SvFolderNode} The current instance for method chaining.
     * @category Node Properties
     */
    setTitle (aString) {
        this.setLabel(aString);
        return this;
    }

    /**
     * @description Gets the accepted subnode types.
     * @returns {Array} An array of accepted field types from SvCreatorNode.
     * @category Node Properties
     */
    acceptedSubnodeTypes () {
        return SvCreatorNode.fieldTypes();
    }

    /**
     * @description Sends the menu action to the target.
     * @category Actions
     */
    sendMenuAction () {
        const t = this.target();
        const m = this.methodName();
        if (t && m && t[m]) {
            t[m].apply(t, [this]);
        }
    }

    /**
     * @description Handles the tap event on the node.
     * @param {SvNode} aNode - The node that was tapped.
     * @returns {SvFolderNode} The current instance for method chaining.
     * @category Event Handling
     */
    onTapOfNode (aNode) {
        super.onTapOfNode();
        this.sendMenuAction();
        return this;
    }

    /**
     * @description Callback for when the parentNode slot is updated.
     * @param {*} oldValue - The old value of the parentNode.
     * @param {*} newValue - The new value of the parentNode.
     * @category Event Handling
     */
    didUpdateSlotParentNode (oldValue, newValue) {
        this.scheduleSyncToView();
    }
}.initThisClass());
