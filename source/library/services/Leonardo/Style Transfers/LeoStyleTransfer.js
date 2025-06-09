"use strict";

/**
 * @module library.services.Leonardo.RefImages
 */

/**
 * @class LeoStyleTransfer
 * @extends SvSummaryNode
 * @classdesc Represents a style transfer.
 * 

Example style transfer request:

  POST https://cloud.leonardo.ai/api/rest/v1/generations
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json

  {
    "prompt": "A serene mountain landscape at dawn",
    "initImageId": "INIT_IMAGE_ID_FROM_OPENAI_UPLOAD",
    "initImageStrength": 0.6,
    "initImageType": "UPLOADED",
    "styleImageIds": ["STYLE_IMAGE_ID"],
    "styleStrength": 0.7,
    "modelId": "ecom-6a1c7c4b-6826-49d5-ae76-d68bc3c8d9b9",  
    "presetStyle": "LEONARDO",
    "photoReal": false,
    "num_images": 1,
    "width": 768,
    "height": 512,
    "guidanceScale": 7,
    "inferenceSteps": 30
  }

*/


(class LeoStyleTransfer extends SvSummaryNode {
  /**
   * @description Initializes the prototype slots for the LeoStyleTransfer class.
   */
  initPrototypeSlots () {

    // need slots for LeonardoImagePrompt
    {
      const slot = this.newSlot("imagePrompt", null);
      slot.setSlotType("LeonardoImagePrompt");
      slot.setFinalInitProto(LeonardoImagePrompt);
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
    }

    // an image we generated on openai (or elsewhere)
    // which we want to perform a style transfer on
    {
      const slot = this.newSlot("initRefImage", null);
      slot.setSlotType("LeonardoRefImage");
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
    }

    // an image we want to use as a style
    {
      const slot = this.newSlot("styleRefImage", null);
      slot.setSlotType("LeonardoRefImage");
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
    }

    // NOTE: the output image will be stored in the imagePrompt object

    /**
     * @member {string} error - Error message if any.
     * @category Error Handling
     */
    {
      const slot = this.newSlot("error", ""); // String
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    /**
     * @member {string} status - Current status of the image.
     * @category Status
     */
    {
      const slot = this.newSlot("status", ""); // String
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Delegate");
      //slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);

    }
  }

  initPrototype () {
    this.setTitle("Style Transfer");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([]);
    this.setNodeCanAddSubnode(false);
    this.setNodeCanReorderSubnodes(false);
    this.setCanDelete(true);
    this.setNodeFillsRemainingWidth(true);
  }


  /**
   * @description Gets the subtitle for the image.
   * @returns {string} The status of the image.
   * @category UI
   */
  subtitle () {
    return this.status();
  }


  /**
   * @description Gets the service used for image generation.
   * @returns {Object} The service.
   * @category Service
   */
  service () {
    return LeonardoService.shared();
  }

  /**
   * @description Checks if there's an error.
   * @returns {boolean} True if there's an error, false otherwise.
   * @category Error Handling
   */
  hasError () {
    return this.error() !== "" && this.error() !== null;
  }


  /**
   * @description Gets the proxy URL for the image.
   * @returns {string} The proxy URL.
   * @category Networking
   */
  getProxyUrl () {
    return ProxyServers.shared().defaultServer().proxyUrlForUrl(this.url());
  }

  proxyXhrForUrl (url, method, bodyString) {
    const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(url);
    const xhr = SvXhrRequest.clone();
    xhr.setUrl(proxyUrl);
    xhr.setMethod(method);
    xhr.setHeaders({
      "Authorization": `Bearer ` + this.service().apiKeyOrUserAuthToken()
    });
    xhr.setDelegate(this);
    xhr.setBody(bodyString);
    return xhr;
  }

  /**
   * @description Starts the style transfer.
   * @returns {Promise<void>}
   * @category Actions
   */
  async start () {
    this.setStatus("starting...");
  
    const imagePrompt = this.imagePrompt();
    const initRefImage = this.initRefImage();
    const styleRefImage = this.styleRefImage();

    assert(imagePrompt, "imagePrompt is required");
    assert(initRefImage, "initRefImage is required");
    assert(styleRefImage, "styleRefImage is required");

    const initImageId = initRefImage.initImageId();
    const styleImageId = styleRefImage.initImageId();

    assert(initImageId, "initImageId is required");
    assert(styleImageId, "styleImageId is required");

    imagePrompt.setInitImageId(initImageId);
    imagePrompt.setStyleImageIds([styleImageId]);

    await imagePrompt.generate();

    this.setStatus(imagePrompt.status());
  }

  copyErrorToClipboard () {
    const error = this.error();
    if (error) {
      navigator.clipboard.writeText(error);
    }
  }

  copyErrorToClipboardActionInfo () {
    return {
      isEnabled: this.hasError(),
      isVisible: this.hasError()
    };
  }

  /**
   * @description Shuts down the image fetching process.
   * @returns {this} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    this.imagePrompt().shutdown();
   return this;
  }

}.initThisClass());