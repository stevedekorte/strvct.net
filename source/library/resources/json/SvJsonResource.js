/**
 * @module library.resources.json
 */

"use strict";

/**
 * @class SvJsonResource
 * @extends SvResource
 * @classdesc Represents a JSON resource.
 */

(class SvJsonResource extends SvResource {
    
    /**
     * @static
     * @description Returns an array of supported file extensions for JSON resources.
     * @returns {string[]} An array of supported file extensions.
     * @category File Handling
     */
    static supportedExtensions () {
        return ["json"];
    }

    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @async
     * @description Asynchronously decodes the JSON data.
     * @returns {Promise<SvJsonResource>} A promise that resolves with the current instance.
     * @category Data Processing
     */
    async asyncDecodeData () {
        const value = JSON.parse(this.data().asString());
        this.setValue(value);
        return this;
    }

    json () {
        return this.value();
    }

}.initThisClass());