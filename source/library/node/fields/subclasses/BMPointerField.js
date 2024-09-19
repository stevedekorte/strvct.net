"use strict";

/**
 * @module library.node.fields.subclasses
 * @class BMPointerField
 * @extends BMField
 * @classdesc A field that's a pointer to another node.
 * (sometimes the other node is used as a list of items, but not always)
 */
(class BMPointerField extends BMField {
    
    /**
     * @description Initializes prototype slots.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype.
     */
    initPrototype () {
        this.setKeyIsEditable(false)
        this.setValueIsEditable(false)
        this.setKeyIsVisible(true)
        this.setValueIsVisible(true)
        this.setNodeTileIsSelectable(true)
    }

    /*
    setValue (v) {
        console.warn("WARNING: BMPointerField setValue '" + v + "'")
        return this
    }
    */

    /**
     * @description Proxy getter for methods of the value object.
     * @param {string} methodName - The name of the method to call on the value object.
     * @param {*} defaultReturnValue - The default return value if the value object is null or undefined.
     * @returns {*} The result of calling the method on the value object, or the default return value.
     */
    proxyGetter(methodName, defaultReturnValue = "") {
        const v = this.value()
        return v ? v[methodName].apply(v) : defaultReturnValue
    }

    /**
     * @description Gets the title of the value object.
     * @returns {string} The title of the value object.
     */
    title () {
        const title = this.proxyGetter("title")
        return title
    }
	
    /**
     * @description Gets the subtitle of the value object.
     * @returns {string} The subtitle of the value object.
     */
    subtitle () {
        return this.proxyGetter("subtitle")
    }
	
    /**
     * @description Gets the note of the value object.
     * @returns {string} The note of the value object.
     */
    note () {
        return this.proxyGetter("note")
    }
	
    /**
     * @description Gets the node tile link.
     * @returns {*} The value of the field.
     */
    nodeTileLink () {
        return this.value()
    }

    /**
     * @description Gets the JSON archive of the value object.
     * @returns {*} The JSON archive of the value object, or undefined if not available.
     */
    jsonArchive () {
        if (this.value() && this.value().jsonArchive) {
            return this.value().jsonArchive()
        }
        return undefined;
    }

}.initThisClass());