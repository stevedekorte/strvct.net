"use strict";

/**
 * @module library.node.storage.base.categories.primitives
 * @class Image_store
 * @extends Image
 * @classdesc Image category with additional methods for storage and serialization.
 */
(class Image_store extends Image {

    shouldStore () {
        return false;
    }

    /**
     * @description Prepares the image for storage by creating a record object.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Object} A record object representing the image for storage.
     * @category Serialization
     */
    recordForStore (/*aStore*/) { // should only be called by Store
        throw new Error("Image_store.recordForStore: not implemented - we use blobs instead of images for storage");
        /*
        let src = this.src;
        if (this.isLoaded()) {
            src = this.asDataURL();
        }

        const dict = {
            type: Type.typeName(this),
            src: src
        };

        return dict;
        */
    }

    /**
     * @description Loads the image from a record object.
     * @param {Object} aRecord - The record object to load from.
     * @param {Object} aStore - The store object to use for reference handling.
     * @returns {Image_store} The current instance after loading the src.
     * @category Deserialization
     */
    loadFromRecord (/*aRecord, aStore*/) {
        throw new Error("Image_store.loadFromRecord: not implemented - we use blobs instead of images for storage");
        /*
        const src = aRecord.src;
        assert(Type.isString(src), "Image_store.loadFromRecord: src is not a string");
        const isDataURL = src.startsWith("data:");
        assert(isDataURL, "Image_store.loadFromRecord: src is not a data URL: " + src);
        this.crossOrigin = "Anonymous";  // Must be before src
        this.src = src;
        return this;
        */
    }


}).initThisCategory();
