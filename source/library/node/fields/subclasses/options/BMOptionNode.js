/**
 * @module library.node.fields.subclasses.options
 */

"use strict";

/**
 * @class BMOptionNode
 * @extends BMStorableNode
 * @classdesc A single option from a set of options choices.
 */
(class BMOptionNode extends BMStorableNode {
    
    /**
     * @description Initializes the prototype slots for the BMOptionNode.
     */
    initPrototypeSlots () {
        /**
         * @member {string} label - The title of the option.
         */
        {
            const slot = this.newSlot("label", "Option Title");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("String");
        }
        /**
         * @member {Object} value - The value associated with the option.
         */
        {
            const slot = this.newSlot("value", null);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Object");
        }
        /**
         * @member {boolean} isPicked - Indicates whether the option is selected.
         */
        {
            const slot = this.newSlot("isPicked", false);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype of the BMOptionNode.
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);
        this.setNodeCanEditTitle(true);
    }

    /**
     * @description Returns a debug type identifier for the node.
     * @returns {string} The debug type identifier.
     */
    debugTypeId () {
        return this.typeId() + "_'" + this.label() + "'";
    }

    /**
     * @description Sets the isPicked property without triggering side effects.
     * @param {boolean} aBool - The boolean value to set.
     * @returns {BMOptionNode} The current instance.
     */
    justSetIsPicked (aBool) {
        assert(Type.isBoolean(aBool));
        this._isPicked = aBool;
        return this;
    }

    /**
     * @description Retrieves the parent BMOptionsNode.
     * @returns {BMOptionsNode|null} The parent BMOptionsNode or null if not found.
     */
    optionsNode () {
        return this.firstParentChainNodeOfClass(BMOptionsNode);
    }

    /**
     * @description Handles the update of the isPicked slot.
     * @param {boolean} oldValue - The previous value of isPicked.
     * @param {boolean} newValue - The new value of isPicked.
     */
    didUpdateSlotIsPicked (oldValue, newValue) {
        const optionsNode = this.optionsNode();
        if (optionsNode) {
            optionsNode.didToggleOption(this);
            this.didUpdateNodeIfInitialized();
        } else {
            debugger;
            // if this is called, the stack views might not have properly synced 
            // after the OptionsNode removed it's subnodes
            console.log("parent: ", this.parentNode().title());
            console.log("grand parent: ", this.parentNode().parentNode().title());
            console.log("great grand parent: ", this.parentNode().parentNode().parentNode().title());
            const result = this.firstParentChainNodeOfClass(BMOptionsNode);
            console.log("result: ", result.title());
            throw new Error("missing BMOptionsNode");
        }
    }

    /**
     * @description Toggles the isPicked state of the option.
     * @returns {BMOptionNode} The current instance.
     */
    toggle () { 
        // The OptionNodeTile knows to call this
        this.setIsPicked(!this.isPicked());
        return this;
    }

    /**
     * @description Sets the title (label) of the option.
     * @param {string} aString - The new title.
     * @returns {BMOptionNode} The current instance.
     */
    setTitle (aString) {
        this.setLabel(aString);
        return this;
    }
    
    /**
     * @description Retrieves the title (label) of the option.
     * @returns {string} The title of the option.
     */
    title () {
        return this.label();
    }

    /**
     * @description Retrieves the value of the option.
     * @returns {string} The title of the option.
     */
    value () {
        return this.title();
    }

    /**
     * @description Retrieves a summary of the option.
     * @returns {string} The title of the option.
     */
    summary () {
        return this.title();
    }

    /**
     * @description Retrieves a note indicating whether the option is picked.
     * @returns {string} A checkmark if the option is picked, otherwise an empty string.
     */
    note () {
        return this.isPicked() ? "✓" : "";
    }

}.initThisClass());