/**
 * @module library.node.fields.subclasses
 */

"use strict";

/**
 * @class SvStringField
 * @extends SvField
 * @classdesc Represents a string field in the application.
 */
(class SvStringField extends SvField {

    /**
     * @static
     * @returns {boolean} True if available as a node primitive.
     * @description Determines if the field is available as a node primitive.
     * @category Availability
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @description Initializes the prototype slots for the SvStringField.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {string} unsetVisibleValue
         * @description The visible value when the field is unset.
         * @category Display
         */
        {
            const slot = this.newSlot("unsetVisibleValue", "");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype with default values.
     * @category Initialization
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
     * @category Synchronization
     */
    syncFromNode () {
        return super.syncFromNode();
    }

}.initThisClass());
