"use strict";

/**
 * @module library.node.fields.subclasses
 * @class BMBooleanField
 * @extends BMField
 * @classdesc BMBooleanField represents a boolean field in the system.
 */
(class BMBooleanField extends BMField {
    
    /**
     * @static
     * @description Indicates if this field is available as a node primitive.
     * @returns {boolean} Always returns true.
     */
    static availableAsNodePrimitive () {
        return true
    }
    
    /**
     * @description Initializes the prototype slots for this field.
     */
    initPrototypeSlots () {
        /**
         * @property {Boolean} value
         * @description The boolean value of the field.
         */
        {
            const slot = this.overrideSlot("value", null);
            slot.setSlotType("Boolean");
            slot.setInitValue(false);
        }

        /**
         * @property {String} unsetVisibleValue
         * @description The visible value when the field is unset.
         */
        {
            const slot = this.newSlot("unsetVisibleValue", "unset");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype of the field.
     */
    initPrototype () {
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
    }

    /**
     * @description Checks if the current value is a boolean.
     * @returns {boolean} True if the value is a boolean, false otherwise.
     */
    valueIsBool () {
        const b = this.value();
        return Type.isBoolean(b);
    }
	
    /**
     * @description Validates the current value of the field.
     * @returns {boolean} True if the value is valid, false otherwise.
     */
    validate () {
        const isValid = this.valueIsBool();
		
        if (!isValid) {
            const targetName = this.target() ? this.target().debugTypeId() : "<no target>";
            const s = "Field '" + this.key() + "' on target '" + targetName + "' needs to be a boolean (true or false) not a " + Type.typeName(this.value());
            console.warn(s);
            debugger;
            this.setValue(false);
            this.setValueError(s);
        } else {
            this.setValueError(null);
        } 
		
        return isValid;
    }
	
    /**
     * @description Normalizes the given value to a boolean.
     * @param {*} v - The value to normalize.
     * @returns {boolean} The normalized boolean value.
     */
    normalizeThisValue (v) {
	    if (v === true || v === "t" || v === "true" | v === 1) { 
            return true; 
        }
	    return false;
    }
	
    /**
     * @description Called after the node is updated.
     * @returns {*} The result of the parent class's didUpdateNode method.
     */
    didUpdateNode () {
        assert(this.hasDoneInit());
        this.validate();
        return super.didUpdateNode();
    }

    /**
     * @description Creates a JSON archive of the field's value.
     * @returns {boolean} The boolean value of the field.
     */
    jsonArchive () {
        return this.value() ? true : false;
    }

    /**
     * @description Sets the field's value from a JSON representation.
     * @param {boolean} json - The JSON boolean value to set.
     * @returns {BMBooleanField} This instance for method chaining.
     */
    setJson (json) {
        assert(Type.isBoolean(json));
        this.setValue(json);
        return this;
    }

}.initThisClass());