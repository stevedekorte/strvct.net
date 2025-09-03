"use strict";

/**
 * @module library.node.fields.json
 * @class SvJsonNullField
 * @extends SvField
 * @classdesc Represents a JSON null field in the application.
 */
(class SvJsonNullField extends SvField {
    
    /**
     * @description Initializes prototype slots for the class.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default values and settings.
     * @category Initialization
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
     * @category Serialization
     */
    jsonArchive () {
        return null
    }

    /**
     * @description Sets the JSON representation of this field.
     * @param {*} json - The JSON data to set (ignored in this implementation).
     * @returns {SvJsonNullField} Returns this instance for method chaining.
     * @category Serialization
     */
    setJson (/*json, jsonPathComponents = []*/) {
        return this
    }

    /**
     * @description Overrides the setValueIsEditable method to always set it to false.
     * @param {boolean} aBool - The boolean value (ignored in this implementation).
     * @returns {SvJsonNullField} Returns this instance for method chaining.
     * @category Configuration
     */
    setValueIsEditable (/*aBool*/) {
        /*
        if (aBool) {
            this.log(".setValueIsEditable true")
        }
        */
        return super.setValueIsEditable(false)
    }
    
}.initThisClass());