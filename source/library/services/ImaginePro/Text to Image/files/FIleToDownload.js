"use strict";


/**
 * @class FileToDownload
 * @extends SvSummaryNode
 * @classdesc Represents a single image to download.
 */

(class FileToDownload extends SvSummaryNode {

    initPrototypeSlots () {

        /**
     * @member {string} url
     * @description The URL of the generated image.
     * @category Image Data
     */
        {
            const slot = this.newSlot("url", "");
            slot.setLabel("Url");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {string} imageUrl
     * @description The data URL of the loaded image for display.
     * @category Image Data
     */
        {
            const slot = this.newSlot("imageUrl", ""); // this is a passthrough to dataUrl
            slot.setLabel("Image");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setFieldInspectorViewClassName("SvImageWellField"); // This makes it display as an image
        }

        /**
     * @member {string} dataUrl
     * @description The data URL of the loaded image (alias for imageUrl).
     * @category Image Data
     */
        {
            const slot = this.newSlot("dataUrl", "");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setCanEditInspection(false);
        }

        /**
     * @member {string} error
     * @description The error message if loading failed.
     * @category Status
     */
        {
            const slot = this.newSlot("error", null);
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Error");
            slot.setCanEditInspection(false);
        }

        /**
     * @member {boolean} isLoading
     * @description Whether the image is currently loading.
     * @category Status
     */
        {
            const slot = this.newSlot("isLoading", false);
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
            slot.setCanEditInspection(false);
        }

        /**
     * @member {Object} delegate
     * @description The delegate object for handling image events.
     * @category Delegation
     */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }

        /**
     * @member {SvXhrRequest} request
     * @description The current XHR request object for debugging.
     * @category Request
     */
        {
            const slot = this.newSlot("request", null);
            slot.setSlotType("SvXhrRequest");
            slot.setShouldStoreSlot(false);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // retry method
        {
            const slot = this.newSlot("asyncFetchAction", null);
            slot.setLabel("Download");
            slot.setSlotType("Action");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncFetch");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([]);
        this.setNodeCanAddSubnode(false);
        this.setCanDelete(true);
        this.setNodeCanReorderSubnodes(false);
    }

    setImageUrl (dataUrl) {
    // this is a passthrough to dataUrl
        this.setDataUrl(dataUrl);
        return this;
    }

    imageUrl () {
    // this is a passthrough to dataUrl
        return this.dataUrl();
    }

    /**
   * @description Gets the title for the image.
   * @returns {string} The title.
   * @category Metadata
   */
    title () {
        return this.hasLoaded() ? "Loaded" : "Loading...";
    }

    /**
   * @description Gets the subtitle for the image.
   * @returns {string} The subtitle.
   * @category Metadata
   */
    subtitle () {
        if (this.hasError()) {
            return "Error: " + this.error();
        }

        if (this.isLoading()) {
            return "Loading...";
        }

        if (this.hasLoaded()) {
            return "Ready";
        }

        return "Pending";
    }

    /**
   * @description Checks if the image has loaded successfully.
   * @returns {boolean} True if loaded, false otherwise.
   * @category Status
   */
    hasLoaded () {
        return this.dataUrl().length > 0;
    }

    /**
   * @description Alias for hasLoaded() to match Leonardo interface.
   * @returns {boolean} True if loaded, false otherwise.
   * @category Status
   */
    isLoaded () {
        return this.hasLoaded();
    }

    /**
   * @description Checks if there was an error loading the image.
   * @returns {boolean} True if there was an error, false otherwise.
   * @category Status
   */
    hasError () {
        return this.error() !== null;
    }

    /**
   * @description Starts loading the image from the URL.
   * @category Loading
   */
    async fetch () {
        if (this.isLoading() || this.hasLoaded() || !this.url()) {
            return;
        }

        this.setIsLoading(true);
        this.setError(null);

        const url = this.url();
        console.log(this.logPrefix() + " fetching url: " + url);

        // Create and configure the XHR request
        const request = SvXhrRequest.clone();
        this.setRequest(request);

        request.setDelegate(this);
        request.setUrl(url);
        request.setMethod("GET");

        // Add headers to make the request look like it's from a browser
        // Midjourney CDN may block requests without proper User-Agent
        const headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        };

        // Only set Referer in browser (causes issues in Node.js)
        if (!SvPlatform.isNodePlatform()) {
            headers["Referer"] = "https://www.midjourney.com/";
        }

        request.setHeaders(headers);
        request.setResponseType("arraybuffer"); // Request binary data as ArrayBuffer (better Node.js compatibility)

        request.setTimeoutPeriodInMs(120 * 1000);
        // Send the request
        await request.asyncSend();


        // Check if request succeeded
        if (request.hasError()) {
            // Error handling is done in delegate methods
            return;
        }

        const arrayBuffer = request.response();

        // Convert ArrayBuffer response to data URL
        const mimeType = request.responseMimeType();
        if (mimeType) {
            console.log(this.logPrefix() + " Response MIME type: " + mimeType);
            const dataUrl = await arrayBuffer.asyncToDataUrl(mimeType);
            this.onLoaded(dataUrl);
        } else {
            this.onError(new Error("No response data received"));
        }
    }

    /**
   * @description Alias for fetch() to match the interface expected by generation classes.
   * @category Loading
   */
    async asyncFetch () {
        return await this.fetch();
    }

    async asyncFetchIfNeeded () {
        if (!this.hasDataUrl()) {
            await this.asyncFetch();
        }
    }

    /**
   * @description Handles successful image loading.
   * @param {string} dataUrl - The loaded image as a data URL.
   * @category Loading
   */
    onLoaded (dataUrl) {
        this.setDataUrl(dataUrl);  // Keep for compatibility
        this.setIsLoading(false);
        this.setError(null);

        console.log(this.logPrefix() + " Loaded Data URL: " + dataUrl.length + " bytes");

        // Notify delegate if it exists
        //this.sendDelegateMessage("onImageLoaded", [this]);
    }

    /**
   * @description Handles image loading errors.
   * @param {Error} error - The error that occurred.
   * @category Loading
   */
    onError (error) {
        this.setError(error);
        this.setIsLoading(false);
        // Notify delegate if it exists
        //this.sendDelegateMessage("onImageError", [this]);
    }

    /**
   * @description Aborts the current image download request.
   * @returns {FileToDownload} The current instance.
   * @category Lifecycle
   */
    abort () {
        const request = this.request();
        if (request && request.isActive()) {
            request.abort();
        }
        this.setIsLoading(false);
        return this;
    }

    /**
   * @description Shuts down the image loading process.
   * @returns {FileToDownload} The current instance.
   * @category Lifecycle
   */
    shutdown () {
        this.abort();
        this.setRequest(null);
        return this;
    }

    // --- SvXhrRequest Delegate Methods ---

    /**
   * @description Called when the image request begins.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
    onRequestBegin (/*request*/) {
    // Request has started
    }

    /**
   * @description Called during image request progress.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
    onRequestProgress (/*request*/) {
    // Progress updates during image download
    }

    /**
   * @description Called when the image request succeeds.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
    onRequestSuccess (/*request*/) {
    // Success handling is done in the main fetch() method
    }

    /**
   * @description Called when the image request fails.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
    onRequestFailure (request) {
        const error = request.error() || new Error(`Image request failed: ${request.status()}`);
        this.onError(error);
    }

    /**
   * @description Called when the image request is aborted.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
    onRequestAbort (/*request*/) {
        this.setIsLoading(false);
        this.setError("Image request aborted");
    }

    /**
   * @description Called when the image request encounters an error.
   * @param {SvXhrRequest} request - The request object.
   * @param {Error} error - The error object.
   * @category Request Delegation
   */
    onRequestError (request, error) {
        this.onError(error);
    }

    /**
   * @description Called when the image request completes.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
    onRequestComplete (/*request*/) {
    // Final cleanup if needed
    }

    hasDataUrl () {
        return this.dataUrl().length > 0;
    }

    dataUrlType () {
        if (!this.hasDataUrl()) {
            return null;
        }
        // read the data type from the data url
        const dataUrl = this.dataUrl();
        const dataUrlType = dataUrl.split(";")[0].split(":")[1];
        return dataUrlType;
    }

    dataUrlMimeType () {
        if (!this.hasDataUrl()) {
            return null;
        }
        const dataUrlType = this.dataUrlType();
        const dataUrlMimeType = dataUrlType.split("/")[1];
        return dataUrlMimeType;
    }

    dataUrlIsImage () {
        if (!this.hasDataUrl()) {
            return false;
        }
        const dataUrlType = this.dataUrlType();
        return dataUrlType.startsWith("image/");
    }

    asSvImage () {
        const image = SvImage.clone();
        assert(this.dataUrl(), "dataUrl is required");
        assert(this.dataUrlIsImage(), "dataUrl is not an image");
        image.setDataURL(this.dataUrl());
        return image;
    }

}.initThisClass());
