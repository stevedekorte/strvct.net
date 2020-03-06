"use strict"

/*

    BMNumberField

    A named number field that validates that the 
    value is a number and shows an appropraite error message.

*/
        
window.BMNumberField = class BMNumberField extends BMField {
    
    static availableAsNodePrimitive() {
        return true
    }

    initPrototype () {
        this.newSlot("unsetVisibleValue", "unset")

        {
            const slot = this.newSlot("isInteger", false)
            slot.setSlotType("Boolean")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setCanEditInspection(true)
            slot.setLabel("Is integer")
            slot.setInspectorPath("Number")
        }

        {
            const slot = this.newSlot("hasLimits", false)
            slot.setSlotType("Boolean")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setCanEditInspection(true)
            slot.setLabel("Has limits")
            slot.setInspectorPath("Number")
        }

        {
            const slot = this.newSlot("minValue", 0)
            slot.setSlotType("Number")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setCanEditInspection(true)
            slot.setLabel("Min Value")
            slot.setInspectorPath("Number")
        }

        {
            const slot = this.newSlot("maxValue", 1)
            slot.setSlotType("Number")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setCanEditInspection(true)
            slot.setLabel("Max value")
            slot.setInspectorPath("Number")
        }
    }

    init () {
        super.init()
        this.setKey("Number title")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(true)
        this.setValue(0)
    }

    setValue (v) {
        super.setValue(Number(v))
        return this
    }

    valueIsNumeric () {
        const n = this.value()
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
	
    validate () {
        const v = Number(this.value())
        const isValid = this.valueIsNumeric()
        const errors = []
        
        if (!isValid) {
            errors.push("This needs to be a number.")
        }

        if (this.hasLimits()) {
            if (v < this.minValue()) {
                errors.push("Must be >= " + this.minValue() + ".")
            }
            if (v > this.maxValue()) {
                errors.push("Must be <= " + this.maxValue() + ".")
            }
        }

        if (this.isInteger()) {
            if (!Number.isInteger(v)) {
                errors.push("Must be an integer.")
            }
        }

        if (errors.length) {
            this.setValueError(errors.join("\n"))
        } else {
            this.setValueError(null)
        }
		
        return isValid
    }
    
}.initThisClass()
