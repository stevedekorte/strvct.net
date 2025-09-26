"use strict";

/**
 * @module library.node.fields.subclasses
 * @class SvIdentityField
 * @extends SvField
 * @classdesc Represents an identity field for Bitcoin-related operations.
 * This field is used to handle and validate Bitcoin public keys.
 */
(class SvIdentityField extends SvField {
    
    /**
     * @description Initializes the prototype slots for the SvIdentityField.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the SvIdentityField.
     * Sets the key and value as non-editable.
     * @category Initialization
     */
    initPrototype () {
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
    }

    /**
     * @description Validates the current value of the field.
     * Sets an error if the value is not a valid Bitcoin public key.
     * @category Validation
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
     * @param {*} inValue - The input value to be set.
     * @returns {SvIdentityField} Returns the instance of the field.
     * @category Data Management
     */
    setValue (inValue) { // called by View on edit
        if (Type.isNull(inValue)) {
            console.log(this.logPrefix(), "WARNING: " + this.svType() + " setValue(null)")
            return this
        }
	    //console.log(this.logPrefix(), "inValue = '" + inValue + "'")
	    let newValue = inValue.strip()
	    
        const parts = newValue.split(" ").concat(newValue.split("\n")).concat(newValue.split(","))
	    //console.log(this.logPrefix(), "parts = '", parts)
        const validPart = parts.detect(part => { return bitcore.PublicKey.isValid(part) })

        if (validPart) {
            newValue = validPart
        }

        if (inValue !== newValue) {
            this.scheduleSyncToView() 
        }
        
        //console.log(this.logPrefix(), "newValue = '" + newValue + "'")
        super.setValue(newValue)
		
        return this
    }

}.initThisClass());