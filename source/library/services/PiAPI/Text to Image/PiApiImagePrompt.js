"use strict";

/**
 * @module library.services.PiAPI.Text_to_Image
 */

/**
 * @class PiApiImagePrompt
 * @extends SvSummaryNode
 * @classdesc Represents a PiAPI image prompt for generating images using Midjourney via PiAPI.
 */
(class PiApiImagePrompt extends SvSummaryNode {  
  initPrototypeSlots () {

    /**
     * @member {string} prompt
     * @description The prompt text for image generation.
     * @category Input
     */
    {
      const slot = this.newSlot("prompt", "");
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    /**
     * @member {string} model
     * @description The model to use for text-to-image generation.
     * @category Configuration
     */
    {
      const slot = this.newSlot("model", "midjourney");
      slot.setInspectorPath("");
      slot.setLabel("Text to Image Model");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setValidValues(["midjourney"]);
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {string} aspectRatio
     * @description The aspect ratio of the generated image.
     * @category Configuration
     */
    {
      const slot = this.newSlot("aspectRatio", "1:1");
      slot.setInspectorPath("")
      slot.setLabel("aspect ratio")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"])
      slot.setIsSubnodeField(true)
    }

    /**
     * @member {string} processMode
     * @description The processing mode for image generation.
     * @category Configuration
     */
    {
      const slot = this.newSlot("processMode", "relax");
      slot.setInspectorPath("")
      slot.setLabel("process mode")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(["relax", "fast", "turbo"])
      slot.setIsSubnodeField(true)
    }

    /**
     * @member {Action} generateAction
     * @description The action to trigger image generation.
     * @category Action
     */
    {
      const slot = this.newSlot("generateAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Generate");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("generate");
    }

    /**
     * @member {string} error
     * @description The error message if any during image generation.
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
     * @member {PiApiImages} images
     * @description The generated images.
     * @category Output
     */
    {
      const slot = this.newSlot("images", null)
      slot.setFinalInitProto(PiApiImages)
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
      const slot = this.newSlot("status", "");
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
    }

    /**
     * @member {string} taskId
     * @description The task ID returned by PiAPI for tracking the generation.
     * @category Status
     */
    {
      const slot = this.newSlot("taskId", "");
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

    /**
     * @member {SvXhrRequest} xhrRequest
     * @description The current XHR request object for debugging.
     * @category Request
     */
    {
      const slot = this.newSlot("xhrRequest", null);
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setLabel("xhr request");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setFinalInitProto(SvXhrRequest);
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

  /**
   * @description Gets the title for the image prompt.
   * @returns {string} The title.
   * @category Metadata
   */
  title () {
    const p = this.prompt().clipWithEllipsis(15);
    return p ? p : this.type() + " Image Prompt";
  }

  /**
   * @description Gets the subtitle for the image prompt.
   * @returns {string} The subtitle.
   * @category Metadata
   */
  subtitle () {
    return this.status()
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
   * @description Gets the parent image prompts node.
   * @returns {Object} The parent image prompts node.
   * @category Hierarchy
   */
  imagePrompts () {
    return this.parentNode()
  }

  /**
   * @description Gets the PiAPI service.
   * @returns {Object} The PiAPI service.
   * @category Service
   */
  service () {
    return PiApiService.shared();
  }

  /**
   * @description Checks if image generation can be performed.
   * @returns {boolean} True if generation can be performed, false otherwise.
   * @category Validation
   */
  canGenerate () {
    return this.prompt().length !== 0;
  }

  /**
   * @description Initiates the image generation process.
   * @category Action
   */
  async generate () {
    await this.start();
  }

  /**
   * @description Gets information about the generate action.
   * @returns {Object} The action information.
   * @category Action
   */
  generateActionInfo () {
    return {
        isEnabled: this.canGenerate(),
        isVisible: true
    }
  }

  /**
   * @description Starts the image generation process.
   * @category Process
   */
  async start () {
    this.setError("");
    this.setStatus("submitting task...");
    this.sendDelegate("onImagePromptStart", [this]);

    const apiKey = this.service().apiKeyOrUserAuthToken();
    const endpoint = 'https://api.piapi.ai/api/v1/task';
    
    const bodyJson = {
      model: this.model(),
      task_type: "imagine",
      input: {
        prompt: this.prompt(),
        aspect_ratio: this.aspectRatio(),
        process_mode: this.processMode(),
        skip_prompt_check: false
      }
    };
    
    const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);

    // Create SvXhrRequest instead of using fetch
    const request = SvXhrRequest.clone();
    request.setDelegate(this);
    request.setUrl(proxyEndpoint);
    request.setMethod("POST");
    request.setHeaders({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    });
    request.setBody(JSON.stringify(bodyJson));
    
    // Store request for debugging
    this.setXhrRequest(request);

    try {
      await request.asyncSend(); // Delegate methods handle errors
      
      if (request.isSuccess()) {
        const responseText = request.responseText();
        const resultData = JSON.parse(responseText).data;
        
        // PiAPI returns a task_id for tracking
        if (resultData.task_id) {
          this.setTaskId(resultData.task_id);
          this.setStatus("task submitted, awaiting completion...");
          
          // Note: In a full implementation, you would poll for task completion
          // or implement webhook handling. For now, we'll just record the task ID.
          this.onTaskSubmitted(resultData);
        } else {
          const error = new Error("No task_id returned from PiAPI");
          this.onError(error);
        }
      }
      // Don't handle request failures here - let delegate methods handle them
    } catch (error) {
      this.onError(error);
      error.rethrow();
    }
  }

  /**
   * @description Handles successful task submission.
   * @param {Object} json - The response JSON from the API.
   * @category Process
   */
  onTaskSubmitted (json) {
    this.setStatus(`Task ${this.taskId()} submitted successfully`);
    this.sendDelegate("onImagePromptTaskSubmitted", [this, json]);
    
    // In a full implementation, you would start polling here
    // For now, we'll just mark it as submitted
    this.onEnd();
  }

  /**
   * @description Handles successful image generation completion.
   * @param {Object} json - The response JSON from the API.
   * @category Process
   */
  onSuccess (json) {
    // This would be called when polling detects completion
    if (json.output && json.output.length > 0) {
      json.output.forEach((imageUrl, index) => {
        const image = this.images().add();
        image.setTitle(`image ${index + 1}`);
        image.setUrl(imageUrl);
        image.fetch();
      });
    }
    
    this.setStatus("completed");
    this.sendDelegate("onImagePromptSuccess", [this, json]);
    this.onEnd();
  }

  /**
   * @description Handles errors during image generation.
   * @param {Error} error - The error object.
   * @category Process
   */
  onError (error) {
    const s = "ERROR: " + error.message;
    console.error(s);
    this.setError(error.message);
    this.setStatus(s);
    this.sendDelegate("onImagePromptError", [this]);
    this.onEnd();
  }

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

  // --- SvXhrRequest Delegate Methods ---

  /**
   * @description Called when the request begins.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestBegin (request) {
    this.setStatus("sending request...");
  }

  /**
   * @description Called during request progress.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestProgress (request) {
    this.setStatus(`uploading: ${request.contentByteCount()} bytes`);
  }

  /**
   * @description Called when the request succeeds.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestSuccess (request) {
    // Success handling is done in the main start() method
    // This is called after the request completes successfully
  }

  /**
   * @description Called when the request fails.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestFailure (request) {
    const error = request.error() || new Error(`Request failed: ${request.status()}`);
    this.onError(error);
  }

  /**
   * @description Called when the request is aborted.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestAbort (request) {
    this.setStatus("request aborted");
    this.onEnd();
  }

  /**
   * @description Called when the request encounters an error.
   * @param {SvXhrRequest} request - The request object.
   * @param {Error} error - The error object.
   * @category Request Delegation
   */
  onRequestError (request, error) {
    this.onError(error);
  }

  /**
   * @description Called when the request completes (success, error, or abort).
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestComplete (request) {
    // Final cleanup can be done here if needed
  }

  /**
   * @description Updates the status of the image prompt.
   * @category Status
   */
  updateStatus () {
    const s = this.images().status();
    if (s) {
      this.setStatus(s);
    }
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
   * @returns {PiApiImagePrompt} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    this.images().subnodes().forEach(image => image.shutdown());
    return this;
  }

}.initThisClass());