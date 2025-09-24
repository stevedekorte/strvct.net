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
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
    }

    /**
     * @member {string} imageUrl
     * @description The data URL of the loaded image for display.
     * @category Image Data
     */
    {
      const slot = this.newSlot("imageUrl", ""); // this is a passthrough to dataUrl
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
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
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setCanEditInspection(false);
    }

    /**
     * @member {string} error
     * @description The error message if loading failed.
     * @category Status
     */
    {
      const slot = this.newSlot("error", "");
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setCanEditInspection(false);
    }

    /**
     * @member {boolean} isLoading
     * @description Whether the image is currently loading.
     * @category Status
     */
    {
      const slot = this.newSlot("isLoading", false);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
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
    return this.error().length > 0;
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
    this.setError("");

    // Use regular fetch for image loading like Leonardo does
    const url = this.url();
    console.log(this.logPrefix() + " fetching url: " + url);
    
    try {
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
          const error = new Error(`HTTP error! Status: ${response.status}`);
          throw error;
      }

      const blob = await response.blob();
      const dataUrl = await blob.asyncToDataUrl();
      this.onLoaded(dataUrl);
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * @description Alias for fetch() to match the interface expected by generation classes.
   * @category Loading
   */
  async asyncFetch () {
    return await this.fetch();
  }

  /**
   * @description Handles successful image loading.
   * @param {string} dataUrl - The loaded image as a data URL.
   * @category Loading
   */
  onLoaded (dataUrl) {
    this.setDataUrl(dataUrl);  // Keep for compatibility
    this.setIsLoading(false);
    this.setError("");
    
    console.log(this.logPrefix() + ' Loaded Data URL: ' + dataUrl.length + " bytes");
    
    // Notify delegate if it exists
    this.sendDelegate("onImageLoaded", [this]);
  }

  /**
   * @description Handles image loading errors.
   * @param {Error} error - The error that occurred.
   * @category Loading
   */
  onError (error) {
    this.setError(error.message);
    this.setIsLoading(false);
    
    // Notify delegate if it exists
    this.sendDelegate("onImageError", [this]);
  }

  /**
   * @description Sends a delegate method call.
   * @param {string} methodName - The name of the method to call.
   * @param {Array} args - The arguments to pass to the method.
   * @returns {boolean} True if the delegate method was called, false otherwise.
   * @category Delegation
   */
  sendDelegate (methodName, args = [this]) {
    const d = this.delegate();
    if (d) {
      const f = d[methodName];
      if (f) {
        f.apply(d, args);
        return true;
      }
    }
    return false;
  }

  /**
   * @description Shuts down the image loading process.
   * @returns {PiApiImage} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    // Cancel any ongoing fetch operations if needed
    this.setIsLoading(false);
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
  onRequestFailure (/*request*/) {
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
    image.setDataUrl(this.dataUrl());
    return image;
  }

}.initThisClass());