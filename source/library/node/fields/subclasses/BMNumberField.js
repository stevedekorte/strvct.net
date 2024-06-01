"use strict";

/*

    BMNumberField

    A named number field that validates that the 
    value is a number and shows an appropraite error message.

*/
        
(class BMNumberField extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("unsetVisibleValue", "unset")
        }

        {
            const slot = this.newSlot("isInteger", false)
            slot.setDuplicateOp("copyValue")
            slot.setSlotType("Boolean")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setCanEditInspection(true)
            slot.setLabel("Is integer")
            slot.setInspectorPath("NumberField")
            //slot.setSyncsToView(true)
        }

        {
            const slot = this.newSlot("hasLimits", false)
            slot.setDuplicateOp("copyValue")
            slot.setSlotType("Boolean")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setCanEditInspection(true)
            slot.setLabel("Has limits")
            slot.setInspectorPath("NumberField")
            //slot.setSyncsToView(true)
        }

        {
            const slot = this.newSlot("minValue", 0)
            slot.setDuplicateOp("copyValue")
            slot.setSlotType("Number")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setCanEditInspection(true)
            slot.setLabel("Min Value")
            slot.setInspectorPath("NumberField")
            //slot.setSyncsToView(true)
        }

        {
            const slot = this.newSlot("maxValue", 1)
            slot.setDuplicateOp("copyValue")
            slot.setSlotType("Number")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setCanEditInspection(true)
            slot.setLabel("Max value")
            slot.setInspectorPath("NumberField")
            //slot.setSyncsToView(true)
        }
    }

    initPrototype () {
    }

    // --- 
    // TODO: 
    // - add a Slot.validatorMethod or methodHook so this can be done dynamically?

    didUpdateSlotIsInteger () {
        this.validate()
    }

    didUpdateSlotHasLimits () {
        this.validate()
    }

    didUpdateSlotMinValue () {
        this.validate()
    }

    didUpdateSlotMaxValue () {
        this.validate()
    }

    // ----

    init () {
        super.init()
        this.setKey("Number title")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(true)
        this.setValue(0)
    }

    setValue (v) {
        if (!Type.isNumber(v)) {
            if (Type.isNull() && this.valueAllowsNull()) {
                // ok
            } else {
                // attempt to coerce to a number
                v = Number(v);
                assert(!Type.isNaN(v), "value must be a number");
                super.setValue(v);
            }
        } else {
            super.setValue(v);
        }
        return this
    }

    valueIsNumeric () {
        const n = this.value();
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
	
    validate () {
        const v = Number(this.value())
        const errors = []
        
        if (!this.valueIsNumeric()) {
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
        
        const isValid = this.valueError() === null
        return isValid
    }
    
}.initThisClass());
