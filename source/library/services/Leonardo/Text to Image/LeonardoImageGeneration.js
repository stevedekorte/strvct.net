"use strict";

/**
 * @module library.services.Leonardo.Text_to_Image
 */

/**
 * @class LeonardoImageGeneration
 * @extends SvSummaryNode
 * @classdesc Polls for the status of an image generation request.
 * 
 * The LeonardoImagePrompt node creates a LeonardoImageGeneration node with the generation id
 * and polls for the status of the generation.
 * 
 * When the generation is complete, the LeonardoImagePrompt node creates LeonardoImage nodes
 * and sets their urls.
 * 
 * To poll, we use the /generations/{generationId} endpoint.
 * 
 * Example request curl command:
 * 
 * curl -X GET \
 *   "https://cloud.leonardo.ai/api/rest/v1/generations/5ea7492a-8499-4706-9e04-1a0bcb5cf6e8" \
 *   -H "Authorization: Bearer $LEONARDO_API_KEY"
 * 
 * Example response:
 * 

  {
    "generations_by_pk": {
      "id": "5ea7492a-8499-4706-9e04-1a0bcb5cf6e8",
      "status": "COMPLETE",        // PENDING | STARTED | COMPLETE | FAILED
      "modelId": "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",
      "prompt": "An oil painting of a cat",
      "imageWidth": 512,
      "imageHeight": 512,
      "inferenceSteps": 30,
      "seed": 465788672,
      "guidanceScale": 7,
      "generated_images": [
        {
          "id": "482a8f60-75cc-4911-94cf-10d624a62c76",
          "url": "https://cdn.leonardo.ai/users/.../Leonardo_Phoenix_oil_cat_0.jpg",
          "nsfw": false,
          "likeCount": 0,
          "motionMP4URL": null,
          "generated_image_variation_generics": []
        }
      ]
    }
  }

  Next, we create LeonardoImage nodes, set their urls, and fetch them.

  */
(class LeonardoImageGeneration extends SvSummaryNode {  

  initPrototypeSlots () {

    /**
     * @member {string} prompt
     * @description The prompt text for image generation.
     * @category Input
     */
    {
      const slot = this.newSlot("generationId", "");
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    /**
   * @member {SvXhrRequest} xhrRequest - The request to fetch the generation json response.
   * @category Networking
   */
    {
      const slot = this.newSlot("xhrRequest", null);
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setLabel("xhr request");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setFinalInitProto(SvXhrRequest);
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    // we need isPolling, pollCount and maxPollCount, and a pollIntervalSeconds
    {
      const slot = this.newSlot("isPolling", false);
      slot.setSlotType("Boolean");
      slot.setShouldStoreSlot(true);
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} pollCount
     * @description The number of times we have polled for the generation status.
     * @category Status
     */
    {
      const slot = this.newSlot("pollCount", 0);
      slot.setSlotType("Number");
      slot.setShouldStoreSlot(true);
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} maxPollCount
     * @description The maximum number of times we will poll for the generation status.
     * @category Status
     */
    {
      const slot = this.newSlot("maxPollCount", 30);
      slot.setSlotType("Number");
      slot.setShouldStoreSlot(true);
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} pollIntervalSeconds
     * @description The interval in seconds between polling for the generation status.
     * @category Status
     */
    {
      const slot = this.newSlot("pollIntervalSeconds", 2); // just for the generation response, images take longer
      slot.setSlotType("Number");
      slot.setShouldStoreSlot(true);
      slot.setIsSubnodeField(true);
    }

      
    /**
     * @member {Action} generateAction
     * @description The action to trigger image generation.
     * @category Action
     */
    {
      const slot = this.newSlot("startPollingAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Start Polling");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("startPolling");
    }

    /**
     * @member {string} error
     * @description The error message if any during image generation.
     * @category Status
     */
    {
      const slot = this.newSlot("error", ""); // null or String
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      //slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    /**
     * @member {LeonardoImages} images
     * @description The generated images.
     * @category Output
     */
    {
      const slot = this.newSlot("images", null);
      slot.setFinalInitProto(LeonardoImages);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("LeonardoImages");
    }

    /**
     * @member {string} status
     * @description The current status of the image generation process.
     * @category Status
     */
    {
      const slot = this.newSlot("status", ""); // String
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
    }

    /**
     * @member {Object} delegate
     * @description The delegate object for handling various events.
     * @category Delegation
     */
    {
      const slot = this.newSlot("delegate", null); 
      slot.setSlotType("Object");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([]);
    this.setNodeCanAddSubnode(false);
    this.setCanDelete(true);
    this.setNodeCanReorderSubnodes(false);
  }

  /**
   * @description Gets the title for the image prompt.
   * @returns {string} The title.
   * @category Metadata
   */
  title () {
    return "Generation";
  }

  /**
   * @description Gets the subtitle for the image prompt.
   * @returns {string} The subtitle.
   * @category Metadata
   */
  subtitle () {
    return [this.generationId(), this.status()].join("\n");
  }

  /**
   * @description Performs final initialization.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setCanDelete(true)
  }

  /**
   * @description Gets the OpenAI service.
   * @returns {Object} The OpenAI service.
   * @category Service
   */
  service () {
    return LeonardoService.shared();
  }

  // --- action button ---

  hasGenerationId () {
    return this.generationId().length > 0;
  }

  /**
   * @description Checks if image generation can be performed.
   * @returns {boolean} True if generation can be performed, false otherwise.
   * @category Validation
   */
  canStartPolling () {
    return this.hasGenerationId() && !this.isPolling();
  }

  /**
   * @description Gets information about the generate action.
   * @returns {Object} The action information.
   * @category Action
   */
  startPollingActionInfo () {
    return {
        isEnabled: this.canStartPolling(),
        //title: this.title(),
        isVisible: true
    }
  }

  // --- start generation ---

  setupXhrRequest () {
    const endpoint = 'https://cloud.leonardo.ai/api/rest/v1/generations/' + this.generationId();
    const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);
    const apiKey = this.service().apiKeyOrUserAuthToken();

    const xhr = this.xhrRequest();
    xhr.clear();
    xhr.setUrl(proxyEndpoint);
    xhr.setMethod("GET");
    xhr.setHeaders({
      "Authorization": `Bearer ` + apiKey,
      "Content-Type": 'application/json'
    });
    xhr.setBody("");
    xhr.setDelegate(this);
    xhr.assertValid();
  }
  

  clear (){
    this.setPollCount(0);
    this.setIsPolling(false);
    this.xhrRequest().abort();
    this.xhrRequest().clear();
    this.setError("");
    this.setStatus("");
  }

  /**
   * @description Starts the image generation process.
   * @category Process
   */
  async startPolling () {
    //debugger;
    assert(!this.isPolling(), "already polling");
    assert(this.generationId(), "generationId is required");

    this.clear();
    this.setPollCount(0);
    this.setIsPolling(true);
    this.setXhrRequest(SvXhrRequest.clone());
    this.setError("");
    this.setStatus("Start polling...");
    this.sendDelegate("onImagePromptStart", [this]);
    await this.poll();
  }

  async pollAfterDelay () {
    setTimeout(() => {
      this.poll();
    }, this.pollIntervalSeconds() * 1000);
  }

  async poll () {
    if (this.pollCount() >= this.maxPollCount()) {
      this.setIsPolling(false);
      this.onError("Max poll count reached");
      return;
    }
    this.setPollCount(this.pollCount() + 1);
    this.setStatus("Poll " + this.pollCount() + " of " + this.maxPollCount());


    try {
      this.setupXhrRequest();
      await this.xhrRequest().asyncSend();
      //debugger;
      // we use onRequestError/onRequestFailure should cover normal cases
    } catch (error) {
      this.onError(error);
    }

    // delegate messages should handle everything

  }

  apiPollStatus () {
    // "status": "PENDING" | "STARTED" | "COMPLETE" | "FAILED",
    try {
      const text = this.xhrRequest().responseText();
      const json = JSON.parse(text);
      return json.generations_by_pk.status;
    } catch (error) {
      debugger;
      return undefined;
    }
  }

  // -- delegate methods from SvXhrRequest --

  async onRequestSuccess (request) {
    //debugger;
    const text = request.responseText();
    const json = JSON.parse(text);

    // "status": "PENDING" | "STARTED" | "COMPLETE" | "FAILED",

    const status = this.apiPollStatus();

    this.setStatus("Generation " + status);

    if (status === "COMPLETE") {
      this.setIsPolling(false);
      this.spawnImageNodes();
    } else if (status === "FAILED") {
      this.onError("Generation failed");
    } else if (json.error) {
      this.onError(json.error);
    } else if (status === "PENDING" || status === "STARTED") {
      await this.pollAfterDelay();
    } else {
      this.onError("Unknown status: " + status);
    }
  }

  async spawnImageNodes () {
  /*
    {
      "generations_by_pk": {
        "generated_images": [
          {
            "url": "https://cdn.leonardo.ai/users/.../cat_0.jpg",
            "nsfw": false,
            "id": "170bcef8-6b69-47eb-a7d7-f63b6c242323",
            "likeCount": 0,
            "generated_image_variation_generics": []
          },
          …
        ],
        "modelId": "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",
        "prompt": "An oil painting of a cat",
        "imageHeight": 512,
        "imageWidth": 512,
        "inferenceSteps": 30,
        "seed": 465788672,
        "guidanceScale": 7,
        "status": "COMPLETE",
        "id": "fbc01981-3312-4229-a2de-fa7d52988290",
        "createdAt": "2023-12-03T13:41:38.253"
      }
    }
  */

    const text = this.xhrRequest().responseText();
    const json = JSON.parse(text);

    if (json.error) {
      this.onError(json.error);
      return;
    }

    const images = json.generations_by_pk.generated_images;
    assert(Type.isArray(images), "images is not an array");

    this.setStatus("Generating images...");

    for (const imageJson of images) {
      const imageNode = this.images().add();
      imageNode.setJsonInfo(imageJson);
      imageNode.setDelegate(this);
      await imageNode.asyncFetch();  // this will parallelize the fetches
    }
  }

  /**
   * @description Handles errors during image generation.
   * @param {Error} error - The error object.
   * @category Process
   */
  onRequestFailure (error) {
    const s = "ERROR: " + error.message;
    console.error(s);
    this.setError(error.message);
    this.setStatus(s);
    this.sendDelegate("onImagePromptError", [this]);
    this.onEnd();
  }

  updateStatus () {
    const allImagesLoaded = this.images().subnodes().every(image => image.isLoaded());
    if (allImagesLoaded) {
      this.setStatus("Generation complete");
    } else {
      // N of M images loaded
      const n = this.images().subnodes().filter(image => image.isLoaded()).length;
      const m = this.images().subnodes().length;
      this.setStatus(`${n} of ${m} images loaded...`);
    }
  }

  // -- delegate methods from LeonardoImage --

  /**
   * @description Handles successful image loading.
   * @param {Object} aiImage - The loaded AI image object.
   * @category Process
   */
  onImageLoaded (aiImage) {
    this.didUpdateNode();
    this.updateStatus();
    this.sendDelegate("onImagePromptImageLoaded", [this, aiImage]);
    this.onEnd();
  }

  /**
   * @description Handles errors during image loading.
   * @param {Object} aiImage - The AI image object that failed to load.
   * @category Process
   */
  onImageError (aiImage) {
    this.didUpdateNode();
    this.updateStatus();
    this.sendDelegate("onImagePromptImageError", [this, aiImage]);
    this.onEnd();
  }

  /**
   * @description Handles the end of the image generation process.
   * @category Process
   */
  onEnd () {
    this.sendDelegate("onImagePromptEnd", [this]);
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
   * @description Shuts down the image prompt and its associated images.
   * @returns {OpenAiImagePrompt} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    if (this.xhrRequest()) {
      this.xhrRequest().abort();
    }
    this.images().subnodes().forEach(image => image.shutdown());
    return this;
  }

}.initThisClass());