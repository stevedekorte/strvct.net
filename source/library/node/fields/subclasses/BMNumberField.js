"use strict"

/*

    BMNumberField

    A named number field that validates that the 
    value is a number and shows an appropraite error message.

*/
        
window.BMNumberField = class BMNumberField extends BMField {
    
    static availableAsPrimitive() {
        return true
    }

    initPrototype () {
        this.newSlot("unsetVisibleValue", "unset")
    }

    init () {
        super.init()
        this.setKey("Number title")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(true)
        this.setValue(0)
    }

    valueIsNumeric () {
        const n = this.value()
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
	
    validate () {
        const isValid = this.valueIsNumeric()
		
        if (!isValid) {
            this.setValueError("This needs to be a number.")
        } else {
            this.setValueError(null)
        } 
		
        return isValid
    }
    
}.initThisClass()
