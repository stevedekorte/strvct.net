"use strict";

/**
 * @module library.node.fields.subclasses
 * @class SvBooleanField
 * @extends SvField
 * @classdesc SvBooleanField represents a boolean field in the system.
 */
(class SvBooleanField extends SvField {
    
    /**
     * @static
     * @description Indicates if this field is available as a node primitive.
     * @returns {boolean} Always returns true.
     * @category Metadata
     */
    static availableAsNodePrimitive () {
        return true
    }
    
    /**
     * @description Initializes the prototype slots for this field.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} value
         * @description The boolean value of the field.
         * @category Data
         */
        {
            const slot = this.overrideSlot("value", null);
            slot.setSlotType("Boolean");
            slot.setInitValue(false);
        }

        /**
         * @member {String} unsetVisibleValue
         * @description The visible value when the field is unset.
         * @category Display
         */
        {
            const slot = this.newSlot("unsetVisibleValue", "unset");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype of the field.
     * @category Initialization
     */
    initPrototype () {
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
    }

    /**
     * @description Checks if the current value is a boolean.
     * @returns {boolean} True if the value is a boolean, false otherwise.
     * @category Validation
     */
    valueIsBool () {
        const b = this.value();
        return Type.isBoolean(b);
    }
	
    /**
     * @description Validates the current value of the field.
     * @returns {boolean} True if the value is valid, false otherwise.
     * @category Validation
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
     * @category Data Processing
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
     * @category Lifecycle
     */
    didUpdateNode () {
        assert(this.hasDoneInit());
        this.validate();
        return super.didUpdateNode();
    }

    /**
     * @description Creates a JSON archive of the field's value.
     * @returns {boolean} The boolean value of the field.
     * @category Serialization
     */
    jsonArchive () {
        return this.value() ? true : false;
    }

    /**
     * @description Sets the field's value from a JSON representation.
     * @param {boolean} json - The JSON boolean value to set.
     * @returns {SvBooleanField} This instance for method chaining.
     * @category Serialization
     */
    setJson (json, jsonPathComponents = []) {
        assert(Type.isBoolean(json), "Expected boolean for JSON path: " + jsonPathComponents.join("/"));
        this.setValue(json);
        return this;
    }

    /*
    init () {
        super.init();
        debugger;
        return this;
    }

    didUpdateSlotValue (oldValue, newValue) {  // setValue() is called by View on edit
        debugger;
        super.didUpdateSlotValue(oldValue, newValue);
        return this;
    }
    */

    syncFromTarget () {
        this.setValue(this.getValueFromTarget());
        return this
    }
    /*
    setValue (v) {
        debugger;
        super.setValue(v);
        return this;
    }
        */

}.initThisClass());