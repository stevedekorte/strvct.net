/**
 * @module library.resources.images.BMURLImage
 */

"use strict";

/**
 * @class BMURLImage
 * @extends BMResource
 * @classdesc Represents an image resource loaded from a URL.
 */
(class BMURLImage extends BMResource {
    
    /**
     * @static
     * @description Returns an array of supported file extensions for images.
     * @returns {string[]} An array of supported file extensions.
     */
    static supportedExtensions () {
        return ["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "webp", /* these aren't well supported -> */ "tif", "tiff", "ico", "cur", "bmp"];
    }

    /**
     * @description Initializes the prototype slots for the BMURLImage class.
     */
    initPrototypeSlots () {
        /**
         * @member {string} dataURL - The data URL of the image.
         */
        {
            const slot = this.newSlot("dataURL", "");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype of the BMURLImage class.
     */
    initPrototype () {
        this.setIsDebugging(false);
    }

    /**
     * @description Returns the title of the image, which is the file name of the path.
     * @returns {string} The title of the image.
     */
    title () {
        return this.path().fileName();
    }

    /**
     * @description Returns the subtitle of the image, which is the file extension of the path.
     * @returns {string} The subtitle of the image.
     */
    subtitle () {
        return this.path().pathExtension();
    }

    /**
     * @description Loads the image data.
     * @returns {BMURLImage} The current instance.
     */
    load () {
        this.loadDataURL();
        return this;
    }

    /**
     * @description Asynchronously loads the data URL of the image.
     * @returns {Promise<BMURLImage>} A promise that resolves to the current instance.
     */
    async loadDataURL () {
        if (this.isDebugging()) {
            this.debugLog(".loadDataURL() " + this.path());
        }

        try {
            const response = await fetch(this.path());
            const blob = await response.blob();
            const dataUrl = await blob.asyncToDataUrl();
            this.setDataURL(dataUrl);
        } catch (error) {
            this.setError(error);
            error.rethrow();
        }

        /*
        const request = new XMLHttpRequest();
        request.open("get", this.path());
        request.responseType = "blob";
        request.onload = () => { this.loadedRequest(request) };
        request.send();
        */
        return this;
    }

    /**
     * @description Sets the data URL after it has been fetched.
     * @param {string} dataURL - The fetched data URL.
     * @returns {BMURLImage} The current instance.
     */
    didFetchDataUrl (dataURL) {
        debugger;
        this.setDataURL(dataURL);
        return this
    }

}.initThisClass());

//console.log("BMURLImage: ", BMURLImage)