"use strict";

/**
 * @module library.node.fields.subclasses
 * @class BMTextAreaField
 * @extends BMField
 * @classdesc BMTextAreaField is a specialized field class for handling text area input.
 * It provides functionality for working with plain text data and can be used as a node primitive.
 */
(class BMTextAreaField extends BMField {
    
    /**
     * @static
     * @description Indicates whether this class is available as a node primitive.
     * @returns {boolean} Always returns true.
     * @category Availability
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @static
     * @description Checks if this class can handle a given MIME type.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the MIME type starts with "text/plain", false otherwise.
     * @category MIME Handling
     */
    static canOpenMimeType (mimeType) {
        return mimeType.startsWith("text/plain");
    }

    /**
     * @static
     * @description Creates a new instance of BMTextAreaField from a data chunk.
     * @param {Object} dataChunk - The data chunk to open.
     * @returns {BMTextAreaField} A new instance of BMTextAreaField with the decoded data.
     * @category Initialization
     */
    static openMimeChunk (dataChunk) {
        const newNode = this.clone();
        newNode.setValue(dataChunk.decodedData());
        newNode.setKeyIsEditable(true);
        newNode.setValueIsEditable(true);
        newNode.setCanDelete(true);
        return newNode;
    }

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {boolean} isMono
         * @description Indicates whether the text area should use a monospace font.
         * @category Appearance
         */
        {
            const slot = this.newSlot("isMono", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the prototype by setting the key as not visible.
     * @category Initialization
     */
    initPrototype () {
        this.setKeyIsVisible(false);
    }

    /**
     * @description Appends text to the current value of the text area.
     * @param {string} text - The text to append.
     * @returns {BMTextAreaField} The instance of the class for method chaining.
     * @category Data Manipulation
     */
    appendToValue (text) {
        this.setValue(this.value() + text);
        return this
    }

    /**
     * @description Synchronizes the field with its target.
     * @returns {BMTextAreaField} The instance of the class for method chaining.
     * @category Synchronization
     */
    syncFromTarget () {
        super.syncFromTarget();
        return this
    }
    
}.initThisClass());