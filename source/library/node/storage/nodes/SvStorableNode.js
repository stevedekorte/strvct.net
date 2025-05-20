"use strict";

/**
 * @module library.node.storage.nodes
 * @class BMStorableNode
 * @extends StyledNode
 * @classdesc BMStorableNode is a thin subclass that overrides some slots and marks them as shouldStore.
 * It also hooks didUpdateSlot() to didMutate so ObjectPool (if observing mutations) gets told it needs to store the change.
 */
(class BMStorableNode extends StyledNode {

    /**
     * @description Initializes the prototype slots for the BMStorableNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        this.setShouldStore(true)
        this.setShouldScheduleDidInit(true)
        //this.setShouldStoreSubnodes(true)

        /**
         * @member {boolean} canDelete
         * @description Indicates if the node can be deleted.
         * @category Node Properties
         */
        {
            const slot = this.overrideSlot("canDelete", false)
            slot.setShouldStoreSlot(true)  // defined in BMNode, but we want to store it
        }

        /**
         * @member {string|null} title
         * @description The title of the node.
         * @category Node Properties
         */
        {
            const slot = this.overrideSlot("title", null)
            slot.setShouldStoreSlot(true)
        }

        /**
         * @member {string} subtitle
         * @description The subtitle of the node.
         * @category Node Properties
         */
        {
            const slot = this.overrideSlot("subtitle", "")
            slot.setShouldStoreSlot(true)
        }

        /**
         * @member {boolean} nodeFillsRemainingWidth
         * @description Indicates if the node fills the remaining width.
         * @category Layout
         */
        {
            const slot = this.overrideSlot("nodeFillsRemainingWidth", false)
            slot.setShouldStoreSlot(true)
            slot.setCanEditInspection(true)
            slot.setCanInspect(true)
        }

        /**
         * @member {SubnodesArray|null} subnodes
         * @description The subnodes of the current node.
         * @category Node Structure
         */
        {
            const slot = this.overrideSlot("subnodes", null)
            //subnodesSlot.setOwnsSetter(true)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookGetter(true)
            //slot.setHookedGetterIsOneShot(true)
            //slot.setIsLazy(true) // no point in using this until we have coroutines?
            slot.setInitProto(SubnodesArray)

            assert(slot.doesHookGetter())
        }
        
        /*
        {
            const slot = this.newSlot("lazySubnodeCount", null)
            slot.setShouldStoreSlot(false)
        }
        */
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Handles updates to slots.
     * @param {Object} aSlot - The slot being updated.
     * @param {*} oldValue - The old value of the slot.
     * @param {*} newValue - The new value of the slot.
     * @category Slot Management
     */
    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue)

	    if (!this.shouldStore() || !this.isInstance()) {
	        return this
	    }
	    
        if (aSlot.shouldStoreSlot()) { 
            //this.didMutate(aSlot.name())
            this.didMutate()
        }
        
        // TODO: HACK, add a switch for this feature
        // TODO: find a way to avoid this?
        /*
        if (newValue !== null && this._subnodes && this._subnodes.includes(oldValue)) { 
            newValue.setParentNode(this)
            this.subnodes().replaceOccurancesOfWith(oldValue, newValue)
            //this.debugLog(" this.subnodes().replaceOccurancesOfWith(", oldValue, ",", newValue, ")")
        }
        */
    }

    /*
    didUpdateSlotSubnodes (oldValue, newValue) {
        super.didUpdateSlotSubnodes(oldValue, newValue)
        this.updateLazySubnodeCount()        
        return this
    }
    */

    /*
    updateLazySubnodeCount () {
        if (this._subnodes) {
            this.setLazySubnodeCount(this.subnodes().length)
        }
    }
    */

    /**
     * @description Handles changes to the subnode list.
     * @returns {BMStorableNode} Returns this instance.
     * @category Node Structure
     */
    didChangeSubnodeList () {
        super.didChangeSubnodeList()
        //this.updateLazySubnodeCount()
        return this
    }

    /**
     * @description Gets the count of subnodes.
     * @returns {number} The number of subnodes.
     * @category Node Structure
     */
    subnodeCount () {
        if (!this._subnodes) {
            return this.lazySubnodeCount()
        }
        return this._subnodes.length
    }

    /**
     * @description Prepares the node for first access.
     * @returns {BMStorableNode} Returns this instance.
     * @category Initialization
     */
    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        return this
    }

}.initThisClass());