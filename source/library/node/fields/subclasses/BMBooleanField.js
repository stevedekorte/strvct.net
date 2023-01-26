"use strict";
      
/*

    BMBooleanField

    
*/

(class BMBooleanField extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }
    
    initPrototypeSlots () {
        this.newSlot("unsetVisibleValue", "unset")
    }

    init () {
        super.init()
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
        this.setValue(false) // why was this commented out?
    }

    valueIsBool () {
        const b = this.value()
        return Type.isBoolean(b);
    }
	
    validate () {
        const isValid = this.valueIsBool()
		
        if (!isValid) {
            this.setValueError("This needs to be a boolean (true or false).")
        } else {
            this.setValueError(null)
        } 
		
        return isValid
    }
	
    normalizeThisValue (v) {
	    if (v === true || v === "t" || v === "true" | v === 1) { return true; }
	    return false
    }
	
    didUpdateNode () {
        this.validate()
        return super.didUpdateNode()
    }

    jsonArchive () {
        return this.value() ? true : false
    }

    setJson (json) {
        assert(Type.isBoolean(json))
        this.setValue(json) 
        return this
    }

}.initThisClass());
