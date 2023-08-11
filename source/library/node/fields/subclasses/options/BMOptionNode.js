"use strict";

/*

    BMOptionNode
    
    A single option from a set of options choices.

*/
        
(class BMOptionNode extends BMStorableNode {
    
    initPrototypeSlots () {
        this.newSlot("label", "Option Title").setShouldStoreSlot(true).setDuplicateOp("copyValue")
        this.newSlot("value", null).setShouldStoreSlot(true).setDuplicateOp("copyValue")
        this.newSlot("isPicked", false).setShouldStoreSlot(true).setDuplicateOp("copyValue")
    }

    initPrototype () {
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(false)
        this.setCanDelete(true)
        this.setNodeCanEditTitle(true)
    }

    /*
    init () {
        super.init()
    }
    */

    justSetIsPicked (aBool) {
        assert(Type.isBoolean(aBool))
        this._isPicked = aBool
        return this
    }

    optionsNode () {
        //debugger
        return this.firstParentChainNodeOfClass(BMOptionsNode)
    }

    didUpdateSlotIsPicked (oldValue, newValue) {
        const optionsNode = this.optionsNode()
        if (optionsNode) {
            optionsNode.didToggleOption(this)
            this.didUpdateNode()
        } else {
            debugger;
            // if this is called, the stack views might not have properly synced 
            // after the OptionsNode removed it's subnodes
            console.log("parent: ", this.parentNode().title())
            console.log("grand parent: ", this.parentNode().parentNode().title())
            console.log("great grand parent: ", this.parentNode().parentNode().parentNode().title())
            const result = this.firstParentChainNodeOfClass(BMOptionsNode)
            console.log("result: ", result.title())
            throw new Error("missing BMOptionsNode")
        }
    }

    toggle () { 
        // The OptionNodeTile knows to call this
        this.setIsPicked(!this.isPicked())
        return this
    }

    setTitle (aString) {
        this.setLabel(aString)
        return this
    }
    
    title () {
        return this.label()
    }

    value () {
        return this.title()
    }

    /*
    subtitle () {
        return null
    }
    */

    summary () {
        return this.title()
    }

    note () {
        return this.isPicked() ? "✓" : ""
    }

    /*
    didUpdateSlotParentNode (oldValue, newValue) {
        super.didUpdateSlotParentNode(oldValue, newValue) 
        if (newValue === null) {
            debugger;
        }
    }
    */

}.initThisClass());
