"use strict";

/**
 * @module library.services.PiAPI.Text_to_Image
 */

/**
 * @class PiApiImageGeneration
 * @extends SvSummaryNode
 * @classdesc Polls for the status of a PiAPI image generation task.
 * 
 * The PiApiImagePrompt node creates a PiApiImageGeneration node with the task ID
 * and polls for the status of the generation.
 * 
 * When the generation is complete, the PiApiImagePrompt node creates PiApiImage nodes
 * and sets their urls.
 * 
 * To poll, we use the /api/v1/task/{task_id} endpoint.
 * 
 * Example request curl command:
 * 
 * curl -X GET \
 *   "https://api.piapi.ai/api/v1/task/12345678-1234-1234-1234-123456789abc" \
 *   -H "x-api-key: $PIAPI_API_KEY"
 * 
 * Example response:
 * 
 * {
 *   "status": "pending",     // pending | processing | success | failed
 *   "task_id": "12345678-1234-1234-1234-123456789abc",
 *   "message": "Task is being processed",
 *   "output": [
 *     "https://cdn.piapi.ai/outputs/image1.jpg",
 *     "https://cdn.piapi.ai/outputs/image2.jpg"
 *   ]
 * }
 * 
 * Next, we create PiApiImage nodes, set their urls, and fetch them.
 */
(class PiApiImageGeneration extends SvSummaryNode {  

  initPrototypeSlots () {

    /**
     * @member {string} taskId
     * @description The task ID for tracking the generation.
     * @category Input
     */
    {
      const slot = this.newSlot("taskId", "");
      slot.setInspectorPath("")
      //slot.setLabel("task id")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    /**
   * @member {SvXhrRequest} xhrRequest - The request to fetch the task status response.
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
      slot.setCanEditInspection(false);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} pollCount
     * @description The number of times we have polled for the task status.
     * @category Status
     */
    {
      const slot = this.newSlot("pollCount", 0);
      slot.setSlotType("Number");
      slot.setCanEditInspection(false);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} maxPollCount
     * @description The maximum number of times we will poll for the task status.
     * @category Status
     */
    {
      const slot = this.newSlot("maxPollCount", 30);
      slot.setSlotType("Number");
      slot.setCanEditInspection(false);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} pollIntervalSeconds
     * @description The interval in seconds between polling for the task status.
     * @category Status
     */
    {
      const slot = this.newSlot("pollIntervalSeconds", 5); // PiAPI tasks typically take longer than Leonardo
      slot.setSlotType("Number");
      slot.setCanEditInspection(false);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnodeField(true);
    }

      
    /**
     * @member {Action} startPollingAction
     * @description The action to trigger polling start.
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
     * @member {PiApiImages} images
     * @description The generated images.
     * @category Output
     */
    {
      const slot = this.newSlot("images", null);
      slot.setFinalInitProto(PiApiImages);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("PiApiImages");
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
   * @description Gets the title for the image generation.
   * @returns {string} The title.
   * @category Metadata
   */
  title () {
    return "Generation";
  }

  /**
   * @description Gets the subtitle for the image generation.
   * @returns {string} The subtitle.
   * @category Metadata
   */
  subtitle () {
    return this.status();
    //return [this.taskId(), this.status()].join("\n");
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
   * @description Gets the PiAPI service.
   * @returns {Object} The PiAPI service.
   * @category Service
   */
  service () {
    return PiApiService.shared();
  }

  // --- action button ---

  hasTaskId () {
    return this.taskId().length > 0;
  }

  /**
   * @description Checks if polling can be started.
   * @returns {boolean} True if polling can be started, false otherwise.
   * @category Validation
   */
  canStartPolling () {
    return this.hasTaskId() && !this.isPolling();
  }

  /**
   * @description Gets information about the start polling action.
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
    const endpoint = 'https://api.piapi.ai/api/v1/task/' + this.taskId();
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
   * @description Starts the polling process.
   * @category Process
   */
  async startPolling () {
    //debugger;
    //assert(!this.isPolling(), "already polling");
    assert(this.taskId(), "taskId is required");

    this.clear();
    this.setPollCount(0);
    this.setIsPolling(true);
    this.setXhrRequest(SvXhrRequest.clone());
    this.setError("");
    this.setStatus("Start polling...");
    this.sendDelegate("onImageGenerationStart", [this]);
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
    // "status": "pending" | "processing" | "success" | "failed"
    try {
      const text = this.xhrRequest().responseText();
      const json = JSON.parse(text).data;
      if (json.status) {
        return json.status;
      }
      return "missing status field";
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

    // "status": "completed" | "processing" | "pending" | "failed" | "staged"

    const status = this.apiPollStatus();

    this.setStatus(status.toLowerCase());

    if (status === "completed") {
      this.setIsPolling(false);
      this.spawnImageNodes();
    } else if (status === "failed") {
      this.onError("Task failed");
    } else if (json.error) {
      this.onError(json.error);
    } else if (status === "pending" || status === "processing" || status === "staged") {
      await this.pollAfterDelay();
    } else {
      this.onError("Unknown status: " + status);
    }
  }

  onError (error) {
    this.setError(error);
    this.setStatus("Error: " + error);
    this.sendDelegate("onImageGenerationError", [this]);
    this.onEnd();
  }

  async spawnImageNodes () {
    this.setStatus("loading images...");

  /*
    Expected response structure:
    {
      "data": {
        "status": "completed",
        "task_id": "12345678-1234-1234-1234-123456789abc",
        "output": {
          "image_url": "https://cdn.piapi.ai/outputs/image.jpg",
          "temporary_image_urls": [
            "https://cdn.piapi.ai/outputs/image1.jpg",
            "https://cdn.piapi.ai/outputs/image2.jpg"
          ]
        }
      }
    }
  */

    const text = this.xhrRequest().responseText();
    const json = JSON.parse(text);

    if (json.error) {
      this.onError(json.error);
      return;
    }

    const data = json.data;
    if (!data || !data.output) {
      this.onError("Missing output data in response");
      return;
    }

    const output = data.output;
    let imageUrls = [];

    // Check for temporary_image_urls array first (multiple images)
    if (output.temporary_image_urls && Type.isArray(output.temporary_image_urls)) {
      imageUrls = output.temporary_image_urls;
    }
    // Fall back to single image_url
    else if (output.image_url) {
      imageUrls = [output.image_url];
    }
    else {
      this.onError("No image URLs found in response");
      return;
    }

    this.setStatus("Generating images...");

    for (const imageUrl of imageUrls) {
      const imageNode = this.images().add();
      imageNode.setUrl(imageUrl);
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
    this.sendDelegate("onImageGenerationError", [this]);
    this.onEnd();
  }

  updateStatus () {
    const allImagesLoaded = this.images().subnodes().every(image => image.isLoaded());
    if (allImagesLoaded) {
      this.setStatus("complete");
    } else {
      // N of M images loaded
      const n = this.images().subnodes().filter(image => image.isLoaded()).length;
      const m = this.images().subnodes().length;
      this.setStatus(`${n} of ${m} images loaded...`);
    }
  }

  // -- delegate methods from PiApiImage --

  /**
   * @description Handles successful image loading.
   * @param {Object} aiImage - The loaded AI image object.
   * @category Process
   */
  onImageLoaded (aiImage) {
    this.didUpdateNode();
    this.updateStatus();
    this.sendDelegate("onImageGenerationImageLoaded", [this, aiImage]);
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
    this.sendDelegate("onImageGenerationImageError", [this, aiImage]);
    this.onEnd();
  }

  /**
   * @description Handles the end of the image generation process.
   * @category Process
   */
  onEnd () {
    //debugger;
    this.sendDelegate("onImageGenerationEnd", [this]);
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
   * @description Shuts down the image generation and its associated images.
   * @returns {PiApiImageGeneration} The current instance.
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