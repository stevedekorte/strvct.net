"use strict";

/**
 * @module library.node.fields.subclasses
 * @class BMStampField
 * @extends BMField
 * @classdesc BMStampField class for handling stamp fields.
 */
(class BMStampField extends BMField {
    
    /**
     * @description Initializes prototype slots for the BMStampField.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the BMStampField.
     */
    initPrototype () {
        //this.setKeyIsVisible(false)
        //this.setKey("drop images here")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
    }
    
}.initThisClass());