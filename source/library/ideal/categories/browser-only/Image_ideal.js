"use strict";

Image.__proto__ = Object;
/**
 * @module library.ideal
 * @class Image_ideal
 * @extends Image
 * @description Some extra methods for the Javascript Image primitive
 */
(class Image_ideal extends Image {

    static async asyncDataUrlForSrc (src) {
        const img = new Image();
        assert(Type.isString(src), "Image.asyncDataUrlForSrc: src must be a string");
        assert(src.length > 0, "Image.asyncDataUrlForSrc: src is empty");
        await img.asyncLoadUrl(src);
        return img.asDataURL();
    }

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

    async asyncLoadUrl (url) {
        this.crossOrigin = "Anonymous";
        // need to set up callbacks in the promise before setting the src!
        const promise = this.promiseLoaded(); // promise resolves when loaded and calls onDidLoad() which may call ddidFetchDataUrl()
        this.src = url;
        return promise;
    }

    /**
     * Handles the image load event.
     * Converts the loaded image to a data URL and notifies the delegate.
     * @returns {Image_ideal} This image instance
     * @category Image Processing
     */
    onDidLoad () {
        // tell the delegate about the loaded data
        if (this._delegate) {
            /**
             * Callback function for the delegate when the image data URL is fetched.
             * @callback didFetchDataUrl
             * @param {string} data - The image data URL
             * @category Image Processing
             */
            this._delegate.didFetchDataUrl(this.asDataURL());
        }

        return this;
    }

    onLoadError (error) {
        console.warn("Image: error loading src '" + this.src + "' ", error);
    }

    asDataURL () {
        if (!this._dataURL) {
            this._dataURL = this.composeDataURL();
        }
        return this._dataURL;
    }

    async promiseLoaded () {
        // we need to store the promise so we don't override the callbacks!
        if (this.isLoaded()) {
            this._promiseLoaded = Promise.resolve(this);
        } else {
            this._promiseLoaded = new Promise((resolve, reject) => {
                this.onload = () => {
                    this.onDidLoad();
                    resolve(this);
                };
                this.onerror = (error) => {
                    error = Error.normalizeError(error);
                    this.onLoadError(error);
                    reject(error);
                };
            });
        }

        return this._promiseLoaded;
    }

    isLoaded () {
        return (this.complete && this.naturalWidth > 0);
    }

    asCanvas () {
        assert(this.isLoaded(), "Can't get canvas for an unloaded image");
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);
        return canvas;
    }

    composeDataURL () {
        return this.asCanvas().toDataURL("image/png");
    }

    async asyncAsBlob () {
        return new Promise((resolve) => {
            const quality = 1.0;
            this.asCanvas().toBlob(resolve, "image/png", quality);
        });
    }

    async asyncAsArrayBuffer () {
        // i need an arraybuffer not a blob
        const blob = await this.asyncAsBlob();
        return await blob.asyncToArrayBuffer();
    }

    async asyncRemoveAllMetadata () {
        await this.promiseLoaded();
        const blob = await this.asyncAsBlob();
        this.src = blob;
        return this;
    }


    async asyncComputeHexSha256Hash () {
        await this.promiseLoaded();

        const canvas = this.asCanvas();

        // ImageData object containing a data propert with aUint8ClampedArray of the raw pixel data
        const imageData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);

        // Hash the pixel buffer
        const hash = await imageData.data.asyncHexSha256();
        this.setHexSha256Hash(hash);
        return hash;
    }

}).initThisCategory();

