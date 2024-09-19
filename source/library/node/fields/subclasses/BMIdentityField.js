"use strict";

/**
 * @module library.node.fields.subclasses
 * @class BMIdentityField
 * @extends BMField
 * @classdesc Represents an identity field for Bitcoin-related operations.
 * This field is used to handle and validate Bitcoin public keys.
 */
(class BMIdentityField extends BMField {
    
    /**
     * @description Initializes prototype slots for the BMIdentityField.
     * @method
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the BMIdentityField.
     * Sets the key and value as non-editable.
     * @method
     */
    initPrototype () {
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
    }

    /**
     * @description Validates the current value of the field.
     * Sets an error if the value is not a valid Bitcoin public key.
     * @method
     */
    validate () {
        if (!bitcore.PublicKey.isValid(this.value())) {
            this.setValueError("invalid address")
        } else {
            this.setValueError(null)
        }
    }
	
    /**
     * @description Sets the value of the field.
     * Processes the input value to extract a valid Bitcoin public key.
     * @method
     * @param {*} inValue - The input value to be set.
     * @returns {BMIdentityField} Returns the instance of the field.
     */
    setValue (inValue) { // called by View on edit
        if (Type.isNull(inValue)) {
            console.log("WARNING: " + this.type() + " setValue(null)")
            return this
        }
	    //console.log("inValue = '" + inValue + "'")
	    let newValue = inValue.strip()
	    
        const parts = newValue.split(" ").concat(newValue.split("\n")).concat(newValue.split(","))
	    //console.log("parts = '", parts)
        const validPart = parts.detect(part => { return bitcore.PublicKey.isValid(part) })

        if (validPart) {
            newValue = validPart
        }

        if (inValue !== newValue) {
            this.scheduleSyncToView() 
        }
        
        //console.log("newValue = '" + newValue + "'")
        super.setValue(newValue)
		
        return this
    }

}.initThisClass());