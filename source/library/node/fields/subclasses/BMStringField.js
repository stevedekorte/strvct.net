/**
 * @module library.node.fields.subclasses
 */

"use strict";

/**
 * @class BMStringField
 * @extends BMField
 * @classdesc Represents a string field in the application.
 */
(class BMStringField extends BMField {
    
    /**
     * @static
     * @returns {boolean} True if available as a node primitive.
     * @description Determines if the field is available as a node primitive.
     */
    static availableAsNodePrimitive () {
        return true
    }

    /**
     * @description Initializes the prototype slots for the BMStringField.
     */
    initPrototypeSlots () {
        /**
         * @property {string} unsetVisibleValue
         * @description The visible value when the field is unset.
         */
        {
            const slot = this.newSlot("unsetVisibleValue", "");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype with default values.
     */
    initPrototype () {
        this.setKey("String title");

        this.setKeyIsVisible(true);
        this.setKeyIsEditable(true);

        this.setValueIsVisible(true);
        this.setValueIsEditable(true);
    }

    /**
     * @description Synchronizes the field from the node.
     * @returns {*} The result of the super class's syncFromNode method.
     */
    syncFromNode () {
        return super.syncFromNode()
    }
    
}.initThisClass());