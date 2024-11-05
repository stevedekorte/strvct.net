"use strict";



if (!getGlobalThis().Image) {
    console.log("WARNING: no Image object found - maybe we are not in browser?");
} else {

    /**
     * @module library.ideal
     * @class Image_ideal
     * @extends Image
     * @description Some extra methods for the Javascript Image primitive
     */
    (class Image_ideal extends Image {

        /**
         * Sets the delegate object for this image.
         * @param {Object} anObject - The delegate object
         * @returns {Image_ideal} This image instance
         * @category Delegation
         */
        setDelegate (anObject) {
            Object.defineSlot(this, "_delegate", anObject);
            return this;
        }

        /**
         * Gets the delegate object for this image.
         * @returns {Object|undefined} The delegate object
         * @category Delegation
         */
        delegate () {
            return this._delegate;
        }

        /**
         * Loads an image from a given URL.
         * @param {string} url - The URL of the image to load
         * @returns {Image_ideal} This image instance
         * @category Image Loading
         */
        loadUrl (url) {
            this.crossOrigin = "Anonymous";
            this.onload = () => { 
                this.onDidLoad();
            }
            this.onerror = () => { 
                console.warn("error loading image " + url);
            }

            this.src = url;
            return this;
        }

        /**
         * Handles the image load event.
         * Converts the loaded image to a data URL and notifies the delegate.
         * @returns {Image_ideal} This image instance
         * @category Image Processing
         */
        onDidLoad () {
            // create a canvas the size of the image
            const canvas = document.createElement("CANVAS");
            canvas.height = this.height;
            canvas.width = this.width;

            // draw image to the canvas
            const ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);

            // get the image data from the canvas
            const data = canvas.toDataURL("image/jpeg");

            // tell the delegate about the loaded data
            if (this._delegate) {
                /**
                 * Callback function for the delegate when the image data URL is fetched.
                 * @callback didFetchDataUrl
                 * @param {string} data - The image data URL
                 * @category Image Processing
                 */
                this._delegate.didFetchDataUrl(data);
            }

            return this;
        }

    }).initThisCategory();

}