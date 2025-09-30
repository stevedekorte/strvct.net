"use strict";

/**
 * @module library.node.fields.subclasses
 * @class SvStampField
 * @extends SvField
 * @classdesc SvStampField class for handling stamp fields.
 */
(class SvStampField extends SvField {

    /**
     * @description Initializes the prototype slots for the SvStampField.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the SvStampField.
     * @category Initialization
     */
    initPrototype () {
        //this.setKeyIsVisible(false)
        //this.setKey("drop images here")
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
    }

}.initThisClass());
