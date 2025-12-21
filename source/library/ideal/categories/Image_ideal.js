"use strict";

// In browser environments, Image needs to inherit from Object for initThisCategory to work
// In Node.js, ImageShim already sets up the prototype chain properly
if (!SvPlatform.isNodePlatform()) {
    Image.__proto__ = Object;
}

/** * @module library.ideal
 */

/** * @class Image_ideal
 * @extends Image
 * @description Some extra methods for the Javascript Image primitive
 
 
 */

/**

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

        // In Node.js, node-canvas has issues with remote URLs (fetch timeouts)
        // Download the image first using native https module, then load as Buffer
        if (SvPlatform.isNodePlatform() && (url.startsWith("http://") || url.startsWith("https://"))) {
            return await this.asyncLoadUrlViaDownload(url);
        }

        // Browser or local file: use direct src assignment
        const promise = this.promiseLoaded();
        this.src = url;
        return promise;
    }

    async asyncLoadUrlViaDownload (url) {
        // Download the image using SvXhrRequest
        const request = SvXhrRequest.clone();
        request.setUrl(url);
        request.setMethod("GET");
        request.setResponseType("arraybuffer"); // Get binary data as ArrayBuffer
        request.setTimeoutPeriodInMs(30000); // 30 second timeout

        await request.asyncSend();

        if (request.hasError()) {
            throw new Error(`Failed to download image from ${url}: ${request.error().message}`);
        }

        const arrayBuffer = request.response();

        // Convert ArrayBuffer to data URL (works in both Node.js and browser)
        // Image.src must always be a string (URL or data URL)
        const mimeType = request.responseMimeType() || "image/png";
        const blob = new Blob([arrayBuffer], { type: mimeType });
        const dataUrl = await FileReader.promiseReadAsDataURL(blob);

        // Set up promise before setting src
        const promise = this.promiseLoaded();

        // Set src to data URL string
        this.src = dataUrl;

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

    srcIsDataURL () {
        return this.src.startsWith("data:");
    }

    async promiseLoaded () {
        // we need to store the promise so we don't override the callbacks!
        if (this._promiseLoaded) {
            return this._promiseLoaded;
        } else {
            this._promiseLoaded = Promise.clone();

            this.onload = () => {
                this.onDidLoad();
                this._promiseLoaded.callResolveFunc(this);
            };

            this.onerror = (error) => {
                error = Error.normalizeError(error);
                this.onLoadError(error);
                this._promiseLoaded.callRejectFunc(error);
            };
        }

        return this._promiseLoaded;
    }

    isLoaded () {
        // Check both complete AND naturalWidth to ensure image is actually loaded
        // In node-canvas, complete can be true before the image loads
        return this.complete && this.naturalWidth > 0;
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

    composeDataURL (mimeType = "image/png") {
        return this.asCanvas().toDataURL(mimeType);
    }

    asDataURL (mimeType = "image/png") {
        if (!this._dataURL) {
            this._dataURL = this.composeDataURL(mimeType);
        }
        return this._dataURL;
    }

    async asyncAsBlob (mimeType = "image/png") {
        // Only wait for load if image isn't already loaded
        // This handles cases where src was changed after initial load
        if (!this.isLoaded()) {
            await this.promiseLoaded();
        }

        const canvas = this.asCanvas();

        // In Node.js, canvas.toBlob doesn't exist - convert via Buffer instead
        if (SvPlatform.isNodePlatform()) {
            // node-canvas provides toBuffer() which returns a Node.js Buffer
            const buffer = canvas.toBuffer(mimeType);
            // Convert Node.js Buffer to Blob (Node.js 18+ has native Blob)
            return new Blob([buffer], { type: mimeType });
        }

        // Browser: use standard toBlob API
        return new Promise((resolve) => {
            const quality = 1.0;
            canvas.toBlob(resolve, mimeType, quality);
        });
    }

    async asyncAsArrayBuffer (mimeType = "image/png") {
        // Only wait for load if image isn't already loaded
        // This handles cases where src was changed after initial load
        if (!this.isLoaded()) {
            await this.promiseLoaded();
        }

        const canvas = this.asCanvas();

        // In Node.js, go directly from canvas to ArrayBuffer via Buffer
        if (SvPlatform.isNodePlatform()) {
            // node-canvas provides toBuffer() which returns a Node.js Buffer
            const buffer = canvas.toBuffer(mimeType);
            // Convert Node.js Buffer to ArrayBuffer
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }

        // Browser: use blob conversion
        const blob = await this.asyncAsBlob(mimeType);
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

