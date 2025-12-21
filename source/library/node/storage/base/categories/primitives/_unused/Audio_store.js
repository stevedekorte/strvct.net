"use strict";

/** * @module library.node.storage.base.categories.primitives
 */

/** * @class Audio_store
 * @extends Audio
 * @classdesc Audio category with additional methods for storage and serialization.
 
 
 */

/**

 */
(class Audio_store extends Audio {

    /**
     * @description Prepares the audio for storage by creating a record object.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Object} A record object representing the audio for storage.
     * @category Serialization
     */
    recordForStore (/*aStore*/) { // should only be called by Store
        const dict = {
            type: Type.typeName(this),
            src: this.src
        };

        return dict;
    }

    /**
     * @description Loads the audio from a record object.
     * @param {Object} aRecord - The record object to load from.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Audio_store} The current instance after loading the src.
     * @category Deserialization
     */
    loadFromRecord (aRecord, /*aStore*/) {
        this.src = aRecord.src;
        return this;
    }


}).initThisCategory();
