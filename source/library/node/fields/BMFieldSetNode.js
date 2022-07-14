"use strict";

/*

    BMFieldSetNode

    Useful for node's which are to be viewed and interacted with as forms
    
    child nodes are of type BMField and should only be added via addFieldNamed()
    This method sets the target of the field to this and the method to the field name.
                    
    example use in subclass 

    in BMCustomFormNode class:
    
        init () {
            super.init()

            this.addFieldNamed("from")
            this.addFieldNamed("to")
            this.addFieldNamed("subject")
            this.addFieldNamed("body").setNodeMinTileHeight(-1)

            this.setActions(["send"])
            this.setCanDelete(true)
        }

        ...

*/  
        
(class BMFieldSetNode extends BMStorableNode {
    
    initPrototype () {
        this.newSlot("status", "")
        this.newSlot("isEditable", true)
    }

    init () {
        super.init()
        this.setShouldStoreSubnodes(false)
    }
    
    didUpdateField (aField) {
        // override to implement hooks
    }
	
    // --- fields ---

    addField (aField) {
        aField.setTarget(this) 
        aField.getValueFromTarget()
        this.addSubnode(aField)
        return aField
    }

    addFieldNamed (name) {	
        const field = BMField.clone().setKey(name)
        field.setTarget(this)
        field.setValueMethod(name)
        this.addStoredField(field)
        return field
    }
    
    fieldNamed (aName) {
        return this.subnodes().detect( (subnode) => { 
            return subnode.valueMethod() === aName || subnode.key() === aName
        })
    }
    
    /*
    valueForFieldNamed (aName) {
        return this.fieldNamed(aName).value()
    }
    */

    // --- validation ---

    validate () {
        return this.invalidSubnodes().length === 0
    }

    invalidSubnodes () {
        return this.subnodes().select(subnode => !subnode.validate())
    }

    isValid () {
        return this.validate() // could cache this later...
    }

}.initThisClass());
