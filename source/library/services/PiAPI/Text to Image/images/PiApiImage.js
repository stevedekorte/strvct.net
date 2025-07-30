"use strict";

/**
 * @module library.services.PiAPI.Text_to_Image.images
 */

/**
 * @class PiApiImage
 * @extends SvSummaryNode
 * @classdesc Represents a single generated image from PiAPI Midjourney service.
 */
(class PiApiImage extends SvSummaryNode {

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
     * @member {string} dataUrl
     * @description The data URL of the loaded image.
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
     * @member {SvXhrRequest} request
     * @description The current XHR request object for debugging.
     * @category Request
     */
    {
      const slot = this.newSlot("request", null);
      slot.setSlotType("SvXhrRequest");
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([]);
    this.setNodeCanAddSubnode(false);
    this.setCanDelete(true);
    this.setNodeCanReorderSubnodes(false);
  }

  /**
   * @description Gets the title for the image.
   * @returns {string} The title.
   * @category Metadata
   */
  title () {
    return this.hasLoaded() ? "Generated Image" : "Loading...";
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

    // Create SvXhrRequest for image loading
    const request = SvXhrRequest.clone();
    request.setDelegate(this);
    request.setUrl(this.url());
    request.setMethod("GET");
    request.setResponseType("blob"); // Important for binary image data
    request.setHeaders({}); // No special headers needed for image loading
    
    // Store request for debugging
    this.setRequest(request);

    try {
      await request.asyncSend();
      
      if (request.isSuccess()) {
        const xhr = request.xhr();
        const blob = xhr.response; // Get the blob response
        const dataUrl = await blob.asyncToDataUrl();
        
        this.onLoaded(dataUrl);
      } else {
        throw new Error(`Image load failed: ${request.status()}`);
      }
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * @description Handles successful image loading.
   * @param {string} dataUrl - The loaded image as a data URL.
   * @category Loading
   */
  onLoaded (dataUrl) {
    this.setDataUrl(dataUrl);
    this.setIsLoading(false);
    this.setError("");
    
    // Notify parent prompt if it exists
    const prompt = this.imagePrompt();
    if (prompt) {
      prompt.onImageLoaded(this);
    }
  }

  /**
   * @description Handles image loading errors.
   * @param {Error} error - The error that occurred.
   * @category Loading
   */
  onError (error) {
    this.setError(error.message);
    this.setIsLoading(false);
    
    // Notify parent prompt if it exists
    const prompt = this.imagePrompt();
    if (prompt) {
      prompt.onImageError(this);
    }
  }

  /**
   * @description Gets the parent image prompt.
   * @returns {Object|null} The parent image prompt or null.
   * @category Hierarchy
   */
  imagePrompt () {
    const images = this.parentNode();
    if (images) {
      return images.parentNode();
    }
    return null;
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
  onRequestBegin (request) {
    // Request has started
  }

  /**
   * @description Called during image request progress.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestProgress (request) {
    // Progress updates during image download
  }

  /**
   * @description Called when the image request succeeds.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestSuccess (request) {
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
  onRequestAbort (request) {
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
  onRequestComplete (request) {
    // Final cleanup if needed
  }

}.initThisClass());