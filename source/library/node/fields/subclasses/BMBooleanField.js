"use strict";
      
/*

    BMBooleanField

    
*/

(class BMBooleanField extends BMField {
    
    static availableAsNodePrimitive () {
        return true
    }
    
    initPrototypeSlots () {
        {
            const slot = this.overrideSlot("value", null);
            slot.setSlotType("Boolean");
            slot.setInitValue(false);
        }

        {
            const slot = this.newSlot("unsetVisibleValue", "unset");
            slot.setSlotType("String");
        }
    }

    initPrototype () {
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
    }

    valueIsBool () {
        const b = this.value();
        return Type.isBoolean(b);
    }
	
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
	
    normalizeThisValue (v) {
	    if (v === true || v === "t" || v === "true" | v === 1) { 
            return true; 
        }
	    return false;
    }
	
    didUpdateNode () {
        assert(this.hasDoneInit());
        //if (this.hasDoneInit()) { 
            this.validate();
        //}
        return super.didUpdateNode();
    }

    jsonArchive () {
        return this.value() ? true : false;
    }

    setJson (json) {
        assert(Type.isBoolean(json));
        this.setValue(json);
        return this;
    }

}.initThisClass());
