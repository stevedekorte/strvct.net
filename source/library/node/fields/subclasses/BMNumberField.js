/**
 * @module library.node.fields.subclasses
 */

"use strict";

/**
 * @class BMNumberField
 * @extends BMField
 * @classdesc A named number field that validates that the 
 * value is a number and shows an appropraite error message.
 */
(class BMNumberField extends BMField {
    
    /**
     * @static
     * @returns {boolean} True if available as a node primitive
     */
    static availableAsNodePrimitive () {
        return true
    }

    /**
     * @description Initialize prototype slots
     */
    initPrototypeSlots () {
        /**
         * @member {string} unsetVisibleValue
         */
        {
            const slot = this.newSlot("unsetVisibleValue", "unset");
            slot.setSlotType("String");
        }

        /**
         * @member {boolean} isInteger
         */
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

        /**
         * @member {boolean} hasLimits
         */
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

        /**
         * @member {number} minValue
         */
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

        /**
         * @member {number} maxValue
         */
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

    /**
     * @description Initialize prototype
     */
    initPrototype () {
    }

    // --- 
    // TODO: 
    // - add a Slot.validatorMethod or methodHook so this can be done dynamically?

    /**
     * @description Handle update of isInteger slot
     */
    didUpdateSlotIsInteger () {
        this.validate()
    }

    /**
     * @description Handle update of hasLimits slot
     */
    didUpdateSlotHasLimits () {
        this.validate()
    }

    /**
     * @description Handle update of minValue slot
     */
    didUpdateSlotMinValue () {
        this.validate()
    }

    /**
     * @description Handle update of maxValue slot
     */
    didUpdateSlotMaxValue () {
        this.validate()
    }

    // ----

    /**
     * @description Initialize the instance
     */
    init () {
        super.init()
        this.setKey("Number title")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(true)
        this.setValue(0)
    }

    /**
     * @description Set the value of the field
     * @param {*} v - The value to set
     * @returns {BMNumberField} The instance
     */
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

    /**
     * @description Check if the value is numeric
     * @returns {boolean} True if the value is numeric
     */
    valueIsNumeric () {
        const n = this.value();
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
	
    /**
     * @description Validate the field value
     * @returns {boolean} True if the value is valid
     */
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