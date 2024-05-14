"use strict";

/*

    BMPassthroughField
    
    A field that:
    - does implement setTarget() 
    - uses 
    - doesn't display a value
    - 
*/

(class BMPassthroughField extends BMField {
    
    initPrototypeSlots () {
        {
            const slot = this.overrideSlot("value", null);
            slot.setCanInspect(true);
            slot.setInspectorPath("Passthrough");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setIsSubnodeField(true);
        }

        this.setShouldStoreSubnodes(false);
    }

    init () {
        super.init()

        this.setKey("Link")
        this.setKeyIsVisible(true);
        this.setKeyIsEditable(false);

        this.setValueIsEditable(false);
        this.setValueIsVisible(false);

        this.setCanDelete(false);
        this.setNodeCanInspect(true);

    }

    // --- pass through key ---

    setKey (v) {
        debugger;
        //this.target().setKey(v);
        return this
    }

    key () {
        return this.target().key();
    }

    // --- pass through value ---

    setValue (v) {
        debugger;
        //this.target().setValue(v);
        return this
    }

    value () {
        return this.target().value();
    }
    
}.initThisClass());
