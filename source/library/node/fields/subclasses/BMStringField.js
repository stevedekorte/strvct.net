"use strict"

/*

    BMStringField

*/
        
window.BMStringField = class BMStringField extends BMField {
    
    static availableAsNodePrimitive() {
        return true
    }

    initPrototype () {
        this.newSlot("unsetVisibleValue", "")
    }

    init () {
        super.init()
        this.setKey("String title")

        this.setKeyIsVisible(true)
        this.setKeyIsEditable(true)

        this.setValueIsVisible(true)
        this.setValueIsEditable(true)
    }
    
}.initThisClass()
