"use strict";

/*

    BMStorableNode 

    Thin subclass to:

    - override some slots and mark them as shouldStore
    - hook didUpdateSlot() to didMutate so ObjectPool (if observing mutations) gets told it needs to store the change
    
*/

(class BMStorableNode extends StyledNode {


    initPrototype () {
        this.setShouldStore(true)
        this.setShouldScheduleDidInit(true)
        //this.setShouldStoreSubnodes(true)

        {
            const slot = this.overrideSlot("canDelete", false)
            slot.setShouldStoreSlot(true)  // defined in BMNode, but we want to store it
        }

        {
            const slot = this.overrideSlot("title", null)
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.overrideSlot("subtitle", "")
            slot.setShouldStoreSlot(true)
        }

        {
            const slot = this.overrideSlot("nodeFillsRemainingWidth", false)
            slot.setShouldStoreSlot(true)
            slot.setCanEditInspection(true)
            slot.setCanInspect(true)
        }

        {
            const slot = this.overrideSlot("subnodes", null)
            //subnodesSlot.setOwnsSetter(true)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookGetter(true)
            //slot.setHookedGetterIsOneShot(true)
            //slot.setIsLazy(true) // no point in using this until we have coroutines? blobs are already lazy?
            slot.setInitProto(SubnodesArray)

            assert(slot.doesHookGetter())
            slot.setupInOwner()
        }
        
        {
            const slot = this.newSlot("lazySubnodeCount", null)
            slot.setShouldStoreSlot(true)
        }
    }

    didInit () {
        super.didInit()
        return this
    }

    // --- udpates ---
	
    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue)

	    if (!this.shouldStore() || !this.isInstance()) {
	        return this
	    }
	    
        if (aSlot.shouldStoreSlot()) { 
            this.didMutate()
        }
        
        // TODO: HACK, add a switch for this feature
        // TODO: find a way to avoid this?
        if (newValue !== null && this._subnodes && this._subnodes.includes(oldValue)) { 
            newValue.setParentNode(this)
            this.subnodes().replaceOccurancesOfWith(oldValue, newValue)
            //this.debugLog(" this.subnodes().replaceOccurancesOfWith(", oldValue, ",", newValue, ")")
        }
    }

    /*
    didUpdateSlotSubnodes (oldValue, newValue) {
        super.didUpdateSlotSubnodes(oldValue, newValue)
        this.updateLazySubnodeCount()        
        return this
    }
    */

    updateLazySubnodeCount () {
        if (this._subnodes) {
            this.setLazySubnodeCount(this.subnodes().length)
        }
    }

    didChangeSubnodeList () {
        super.didChangeSubnodeList()
        this.updateLazySubnodeCount()
        return this
    }

    // --- stored slots ---
    
    initStoredSubnodeSlotWithProto (name, proto) {
        const obj = proto.clone()
        this.newSlot(name, obj)
        this.justAddSubnode(obj)
        this.addStoredSlot(name)
        return this
    }
	
    // subnodes
    
    subnodeCount () {
        if (!this._subnodes) {
            return this.lazySubnodeCount()
        }
        return this._subnodes.length
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        return this
    }

}.initThisClass());
