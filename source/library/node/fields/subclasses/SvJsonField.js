"use strict";

/** * @module library.node.fields.subclasses
 */

/**
 * @class SvJsonField
 * @extends SvField
 * @classdesc SvJsonField is a specialized field for handling JSON data.
 * It provides functionality to set and retrieve JSON values, and interact with SvJsonNode.
 */

/**

 */
(class SvJsonField extends SvField {

    /**
     * @description Initializes the prototype slots for the SvJsonField.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {SvJsonNode} nodeTileLink - The associated SvJsonNode for this field.
         * @category Data
         */
        {
            const slot = this.newSlot("nodeTileLink", null);
            slot.setSlotType("SvJsonNode");
        }
    }

    /**
     * @description Initializes the prototype with default settings.
     * @category Initialization
     */
    initPrototype () {
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
        this.setKeyIsVisible(true);
        this.setValueIsVisible(true);
        this.setNodeTileIsSelectable(true);
    }

    /**
     * @description Sets the value of the field by creating a SvJsonNode.
     * @param {*} v - The value to set.
     * @returns {SvJsonField} - Returns this instance for method chaining.
     * @category Data Manipulation
     */
    setValue (v) {
        console.warn("WARNING: SvJsonField setValue '" + v + "'");
        const node = SvJsonNode.nodeForJson(v);
        this.setNodeTileLink(node);
        return this;
    }

    /**
     * @description Retrieves the JSON value of the field.
     * @returns {*} The JSON value, or undefined if no nodeTileLink exists.
     * @category Data Retrieval
     */
    value () {
        const node = this.nodeTileLink();
        if (node) {
            return node.serializeToJson(null, []);
        }
        return undefined;
    }

    /**
     * @description A proxy method to call methods on the value object.
     * @param {string} methodName - The name of the method to call on the value object.
     * @param {*} defaultReturnValue - The default value to return if the method call fails.
     * @returns {*} The result of the method call or the default return value.
     * @category Utility
     */
    proxyGetter (methodName, defaultReturnValue = "") {
        const v = this.value();
        return v ? v[methodName].apply(v) : defaultReturnValue;
    }

    /**
     * @description Gets the title of the JSON field.
     * @returns {string} The title of the field.
     * @category Data Retrieval
     */
    title () {
        return this.proxyGetter("title");
    }

    /**
     * @description Gets the subtitle of the JSON field.
     * @returns {string} The subtitle of the field.
     * @category Data Retrieval
     */
    subtitle () {
        return this.proxyGetter("subtitle");
    }

    /**
     * @description Gets the note of the JSON field.
     * @returns {string} The note of the field.
     * @category Data Retrieval
     */
    note () {
        return this.proxyGetter("note");
    }

}.initThisClass());
