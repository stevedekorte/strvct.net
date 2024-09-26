"use strict";

/**
 * @module library.node.fields
 * @class BMFieldSetNode
 * @extends BMStorableNode
 * @classdesc Useful for nodes which are to be viewed and interacted with as forms.
 * Child nodes are of type BMField and should only be added via addFieldNamed().
 * This method sets the target of the field to this and the method to the field name.
 * 
 * Example use in subclass:
 * 
 * In BMCustomFormNode class:
 * 
 *     init () {
 *         super.init()
 * 
 *         this.addFieldNamed("from")
 *         this.addFieldNamed("to")
 *         this.addFieldNamed("subject")
 *         this.addFieldNamed("body").setNodeMinTileHeight(-1)
 * 
 *         this.setActions(["send"])
 *         this.setCanDelete(true)
 *     }
 */
(class BMFieldSetNode extends BMStorableNode {
    
    /**
     * @description Initializes prototype slots for the BMFieldSetNode.
     */
    initPrototypeSlots () {
        /**
         * @member {string} status - The status of the field set.
         */
        {
            const slot = this.newSlot("status", "");
            slot.setSlotType("String");
        }
        /**
         * @member {boolean} isEditable - Determines if the field set is editable.
         */
        {
            const slot = this.newSlot("isEditable", true);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype of the BMFieldSetNode.
     */
    initPrototype () {
        this.setShouldStoreSubnodes(false)
    }
    
    /**
     * @description Called when a field is updated.
     * @param {BMField} aField - The field that was updated.
     */
    didUpdateField (aField) {
        // override to implement hooks
    }
	
    // --- fields ---

    /**
     * @description Adds a field to the field set.
     * @param {BMField} aField - The field to add.
     * @returns {BMField} The added field.
     */
    addField (aField) {
        aField.setTarget(this) 
        aField.getValueFromTarget()
        this.addSubnode(aField)
        return aField
    }

    /**
     * @description Adds a field with the given name to the field set.
     * @param {string} name - The name of the field to add.
     * @returns {BMField} The added field.
     */
    addFieldNamed (name) {	
        const field = BMField.clone().setKey(name)
        field.setTarget(this)
        field.setValueMethod(name)
        this.addStoredField(field)
        return field
    }
    
    /**
     * @description Finds a field by name.
     * @param {string} aName - The name of the field to find.
     * @returns {BMField|undefined} The found field or undefined if not found.
     */
    fieldNamed (aName) {
        return this.subnodes().detect(sn => { 
            return sn.valueMethod() === aName || sn.key() === aName
        })
    }
    
    /*
    valueForFieldNamed (aName) {
        return this.fieldNamed(aName).value()
    }
    */

    // --- validation ---

    /**
     * @description Validates all fields in the field set.
     * @returns {boolean} True if all fields are valid, false otherwise.
     */
    validate () {
        return this.invalidSubnodes().length === 0
    }

    /**
     * @description Gets all invalid subnodes (fields) in the field set.
     * @returns {BMField[]} An array of invalid fields.
     */
    invalidSubnodes () {
        return this.subnodes().select(sn => !sn.validate())
    }

    /**
     * @description Checks if the field set is valid.
     * @returns {boolean} True if the field set is valid, false otherwise.
     */
    isValid () {
        return this.validate() // could cache this later...
    }

}.initThisClass());