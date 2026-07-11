"use strict";

/** * @module library.node.storage.nodes
 */

/** * @class SvStorableNode
 * @extends SvStyledNode
 * @classdesc SvStorableNode is a thin subclass that overrides some slots and marks them as shouldStore.
 * It also hooks didUpdateSlot() to didMutate so SvObjectPool (if observing mutations) gets told it needs to store the change.
 */

(class SvStorableNode extends SvStyledNode {

    /**
     * @description Initializes the prototype slots for the SvStorableNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        this.setShouldStore(true);
        this.setShouldScheduleDidInit(true);
        //this.setShouldStoreSubnodes(true)

        /**
         * @member {boolean} canDelete
         * @description Indicates if the node can be deleted.
         * @category Node Properties
         */
        {
            const slot = this.overrideSlot("canDelete", false);
            slot.setShouldStoreSlot(true);  // defined in SvNode, but we want to store it
        }

        /**
         * @member {string|null} title
         * @description The title of the node.
         * @category Node Properties
         */
        {
            const slot = this.overrideSlot("title", null);
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {string} subtitle
         * @description The subtitle of the node.
         * @category Node Properties
         */
        {
            const slot = this.overrideSlot("subtitle", "");
            slot.setShouldStoreSlot(true);
        }

        /**
         * @member {boolean} nodeFillsRemainingWidth
         * @description Indicates if the node fills the remaining width.
         * @category Layout
         */
        {
            const slot = this.overrideSlot("nodeFillsRemainingWidth", false);
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
            slot.setCanInspect(true);
        }

        /**
         * @member {SvSubnodesArray|null} subnodes
         * @description The subnodes of the current node.
         * @category Node Structure
         */
        {
            const slot = this.overrideSlot("subnodes", null);
            //subnodesSlot.setOwnsSetter(true)
            slot.setShouldStoreSlot(true);
            slot.setDoesHookGetter(true);
            //slot.setHookedGetterIsOneShot(true)
            //slot.setIsLazy(true) // no point in using this until we have coroutines?
            slot.setInitProto(SvSubnodesArray);

            assert(slot.doesHookGetter());
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
     * @description Mutation broadcast, filtered for the lazy-slot
     * materialization write-back echo. While THIS instance's stub is being
     * written back into its slot, its own state is exactly the stored state —
     * broadcasting a mutation would mark it dirty for a change the store
     * already has (and, mid-store-pass, trip the pool's double-store guard).
     * Per-INSTANCE deliberately: objects genuinely created or changed by
     * hooks during someone else's materialization must still broadcast and be
     * stored — only the materializing object's own echo is filtered. The
     * cross-object side effect (the didUpdateNode bubble touching an
     * ancestor's cloud timestamp) is handled separately by
     * SvSyncable*.touchLocalModified consulting the global
     * Slot.isMaterializingAnyLazySlot().
     * @param {string} [optionalSlotName]
     * @category Mutation
     */
    didMutate (optionalSlotName) {
        if (this.isMaterializingLazySlot()) {
            return;
        }
        super.didMutate(optionalSlotName);
    }

    /**
     * @description Handles updates to slots.
     * @param {Object} aSlot - The slot being updated.
     * @param {*} oldValue - The old value of the slot.
     * @param {*} newValue - The new value of the slot.
     * @category Slot Management
     */
    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue);

	    if (!this.shouldStore() || !this.isInstance()) {
	        return this;
	    }

        if (aSlot.shouldStoreSlot()) {
            // the materialization write-back echo is filtered per-instance in
            // this class's didMutate override, so all self-didMutate paths
            // (this one, didChangeSubnodeList, …) share one guard
            this.didMutate();
        }

        // TODO: HACK, add a switch for this feature
        // TODO: find a way to avoid this?
        /*
        if (newValue !== null && this._subnodes && this._subnodes.includes(oldValue)) {
            newValue.setParentNode(this)
            this.subnodes().replaceOccurancesOfWith(oldValue, newValue)
            //this.logDebug(" this.subnodes().replaceOccurancesOfWith(", oldValue, ",", newValue, ")")
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
     * @returns {SvStorableNode} Returns this instance.
     * @category Node Structure
     */
    didChangeSubnodeList () {
        super.didChangeSubnodeList();
        //this.updateLazySubnodeCount()
        return this;
    }

    /**
     * @description Gets the count of subnodes.
     * @returns {number} The number of subnodes.
     * @category Node Structure
     */
    subnodeCount () {
        if (this.slotIsPendingMaterialization("subnodes")) {
            return this.subnodes().length; // asking for the count is asking for the value
        }
        if (!this._subnodes) {
            return this.lazySubnodeCount();
        }
        return this._subnodes.length;
    }

    /**
     * @description Prepares the node for first access.
     * @returns {SvStorableNode} Returns this instance.
     * @category Initialization
     */
    prepareForFirstAccess () {
        super.prepareForFirstAccess();
        return this;
    }

}.initThisClass());
