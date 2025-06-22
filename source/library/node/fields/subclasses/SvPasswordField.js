/**
 * @module library.node.fields.subclasses
 */

"use strict"; 

/**
 * @class SvPasswordField
 * @extends SvStringField
 * @classdesc Represents a password field in the application. Inherits from SvStringField but provides password-specific behavior.
 */
(class SvPasswordField extends SvStringField {
    
    /**
     * @static
     * @returns {boolean} True if available as a node primitive.
     * @description Determines if the field is available as a node primitive.
     * @category Availability
     */
    static availableAsNodePrimitive () {
        return true
    }

    /**
     * @description Initializes the prototype slots for the SvPasswordField.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default values.
     * @category Initialization
     */
    initPrototype () {
        this.setKey("Password");

        this.setKeyIsVisible(true);
        this.setKeyIsEditable(true);

        this.setValueIsVisible(true);
        this.setValueIsEditable(true);
    }

    /**
     * @description Synchronizes the field from the node.
     * @returns {*} The result of the super class's syncFromNode method.
     * @category Synchronization
     */
    syncFromNode () {
        return super.syncFromNode()
    }
    
}.initThisClass());