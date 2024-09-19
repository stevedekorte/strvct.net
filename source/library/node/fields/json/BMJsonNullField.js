/**
 * @module library.node.fields.json
 */

"use strict";

/**
 * @class BMJsonNullField
 * @extends BMField
 * @classdesc Represents a JSON null field in the application.
 */
(class BMJsonNullField extends BMField {
    
    /**
     * @description Initializes prototype slots for the class.
     * @private
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default values and settings.
     */
    initPrototype () {
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(false)
        this.setCanDelete(true)
        //this.setNoteIconName("right-arrow")

        this.setKeyIsVisible(false)
        this.setValue("NULL")
        //this.setValueIsEditable(false)
        //this.overrideSlot("valueIsEditable", false).setInitValue(false)
    }

    /**
     * @description Returns the JSON archive representation of this field.
     * @returns {null} Always returns null for this field type.
     */
    jsonArchive () {
        return null
    }

    /**
     * @description Sets the JSON representation of this field.
     * @param {*} json - The JSON data to set (ignored in this implementation).
     * @returns {BMJsonNullField} Returns this instance for method chaining.
     */
    setJson (json) {
        return this
    }

    /**
     * @description Overrides the setValueIsEditable method to always set it to false.
     * @param {boolean} aBool - The boolean value (ignored in this implementation).
     * @returns {BMJsonNullField} Returns this instance for method chaining.
     */
    setValueIsEditable (aBool) {
        /*
        if (aBool) {
            console.log(this.type() + " setValueIsEditable true")
        }
        */
        return super.setValueIsEditable(false)
    }
    
}.initThisClass());