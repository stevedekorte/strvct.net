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

    composeDataURL () {
        assert(this.isLoaded(), "Can't compose data URL for an unloaded image");

        // create a canvas the size of the image
        const canvas = document.createElement("CANVAS");
        canvas.height = this.height;
        canvas.width = this.width;

        // draw image to the canvas
        const ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);

        // get the image data from the canvas
        const dataURL = canvas.toDataURL("image/jpeg");
        return dataURL;
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
                }
                this.onerror = (error) => {
                    this.onLoadError(error);
                    reject(error);
                }
            });
        }

        return this._promiseLoaded;
    }

    isLoaded () {
        return (img.complete && img.naturalWidth > 0);
    }


    async asyncAsBlob () {
        await this.promiseLoaded();
        const dataUrl = this.asDataURL();
   
        return new Promise((resolve) => {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            resolve(new Blob([u8arr], { type: mime }));
        });
    }
 
    async asyncRemoveAllMetadata () {
        await this.promiseLoaded();

        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this, 0, 0);
        
        const promise = Promise.clone();

        // Render to blob (this strips all metadata)
        canvas.toBlob((blob) => {
            if (blob) {
                // set the src to the blob - now without metadata
                this.src = blob;
                promise.callResolveFunc(this);
            } else {
                const error = new Error("Failed to convert canvas to blob");
                promise.callRejectFunc(error);
            }
        }, 'image/png', 1.0); // Use PNG for lossless quality

        return promise;
    }

}).initThisCategory();

