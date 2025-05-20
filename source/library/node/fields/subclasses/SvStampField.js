"use strict";

/**
 * @module library.node.fields.subclasses
 * @class SvStampField
 * @extends BMField
 * @classdesc BMStampField class for handling stamp fields.
 */
(class SvStampField extends BMField {
    
    /**
     * @description Initializes the prototype slots for the SvStampField.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the BMStampField.
     * @category Initialization
     */
    initPrototype () {
        //this.setKeyIsVisible(false)
        //this.setKey("drop images here")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
    }
    
}.initThisClass());