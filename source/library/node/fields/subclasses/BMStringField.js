"use strict";

/*

    BMStringField

*/
        
(class BMStringField extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("unsetVisibleValue", "");
        }
    }

    initPrototype () {
        this.setKey("String title");

        this.setKeyIsVisible(true);
        this.setKeyIsEditable(true);

        this.setValueIsVisible(true);
        this.setValueIsEditable(true);
    }

    syncFromNode () {
        return super.syncFromNode()
    }
    
}.initThisClass());
