"use strict"

/*

    BMData

*/

window.BMData = class BMData extends BMStorableNode {
    
    initPrototype () {
        this.newSlot("value", "").setSyncsToView(true).setShouldStoreSlot(true)
        this.newSlot("size", 0).setShouldStoreSlot(true)
    }

    init () {
        super.init()
        this.setNodeMinWidth(600)
        this.setShouldStore(true)
        return this
    }

    subtitle () {
        return this.size()
    }

    didUpdateSlotValue (oldValue, newValue) {
        if (newValue) {
            this.setSize(newValue.length)
        } else {
            this.setSize(0)
        }
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        const field = BMTextAreaField.clone().setKey("value")
        field.setValueMethod("value")
        field.setValueIsEditable(false)
        field.setIsMono(true)
        field.setTarget(this) 
        field.getValueFromTarget()
        this.addSubnode(field)        
    }

}.initThisClass()
