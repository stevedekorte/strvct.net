"use strict";

/**
 * @module library.services.ImaginePro.Text_to_Image
 */

/**
 * @class ImagineProImagePrompt
 * @extends SvSummaryNode
 * @classdesc Represents an ImaginePro image prompt for generating images using Midjourney via ImaginePro API.
 * 
 * IMPORTANT: This implementation ONLY supports Midjourney V7 or later versions.
 * We do NOT support V6 or earlier versions. All prompts will be sent with --v 7 flag.
 * Omnireference uses V7's --oref and --ow parameters (not V6's --cref/--cw).
 */
(class ImagineProImagePrompt extends SvSummaryNode {  

  initPrototypeSlots () {

    // --- prompt ---

    /**
     * @member {string} prompt
     * @description The prompt text for image generation.
     * @category Input
     */
    {
      const slot = this.newSlot("prompt", "");
      slot.setInspectorPath("");
      slot.setAllowsNullValue(false);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }



    /**
     * @member {string} promptSuffix
     * @description Additional parameters to append to the prompt (e.g., "--no details --no frame").
     * @category Configuration
     */
    {
        const slot = this.newSlot("promptSuffix", "");
        slot.setSlotType("String");
        slot.setAllowsNullValue(false);
        slot.setLabel("Prompt Suffix");
        slot.setIsSubnodeField(true);
        slot.setShouldStoreSlot(true);
        slot.setSyncsToView(true);
        slot.setDuplicateOp("duplicate");
        slot.setCanEditInspection(true);
        slot.setDescription("Additional Midjourney parameters to append (e.g., '--no details --no frame --chaos 50')");
    }

    // --- settings ---

    /**
     * @member {string} model
     * @description The model to use for text-to-image generation.
     * @category Configuration
     */
    {
      const slot = this.newSlot("model", "midjourney");
      slot.setInspectorPath("Settings");
      //slot.setLabel("Text to Image Model");
      slot.setLabel("Model");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setValidValues(["midjourney"]);
      slot.setIsSubnodeField(true);
      slot.setSummaryFormat("key: value");
    }

    /**
     * @member {string} aspectRatio
     * @description The aspect ratio of the generated image.
     * @category Configuration
     */
    {
      const slot = this.newSlot("aspectRatio", "1:1");
      slot.setInspectorPath("Settings");
      slot.setLabel("Aspect Ratio");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setValidValues(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"]);
      slot.setIsSubnodeField(true);
      slot.setSummaryFormat("key: value");
    }

    /**
     * @member {string} processMode
     * @description The processing mode for image generation.
     * @category Configuration
     */
    {
      const slot = this.newSlot("processMode", "fast");
      slot.setInspectorPath("Settings");
      slot.setLabel("Process Mode");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setValidValues(["relax", "fast", "turbo"]);
      slot.setIsSubnodeField(true);
      slot.setSummaryFormat("key: value");
    }

    // --- generation ---

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
      const slot = this.newSlot("error", null);
      slot.setAllowsNullValue(true);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Error");
      slot.setCanEditInspection(false);
      slot.setSummaryFormat("key value");
    }


    /**
     * @member {string} status
     * @description The current status of the image generation process.
     * @category Status
     */
    {
      const slot = this.newSlot("status", "");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setSummaryFormat("key value");
    }

    /**
     * @member {string} taskId
     * @description The task ID returned by ImaginePro for tracking the generation.
     * @category Status
     */
    {
      const slot = this.newSlot("taskId", "");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setSummaryFormat("key value");
    }

    /**
     * @member {ImagineProImageGenerations} generations
     * @description The generations for tracking task status.
     * @category Output
     */
    {
      const slot = this.newSlot("generations", null);
      slot.setFinalInitProto(ImagineProImageGenerations);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("ImagineProImageGenerations");
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

    /**
     * @member {string} omniRefImageUrl
     * @description URL to character reference sheet composite image for Midjourney V7+ omnireference.
     * This will be used with --oref parameter (V7's omnireference flag).
     * NOTE: We ONLY support V7 or later - V6's --cref is NOT supported.
     * @category Configuration
     */
    {
      const slot = this.newSlot("omniRefImageUrl", null);
      slot.setSlotType("String");
      slot.setLabel("Omnireference Image URL");
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setCanEditInspection(true);
      slot.setDescription("URL to character reference sheet composite image for Midjourney (Firebase Storage or other hosted URL)");
    }

    {
        const slot = this.newSlot("completionPromise", null);
        slot.setSlotType("Promise");
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

  /**
   * @description Gets the title for the image prompt.
   * @returns {string} The title.
   * @category Metadata
   */
  title () {
    const p = this.prompt().clipWithEllipsis(15);
    return p ? p : "Image Prompt";
  }

  /**
   * @description Gets the subtitle for the image prompt.
   * @returns {string} The subtitle.
   * @category Metadata
   */
  subtitle () {
    return this.status();
  }

  /**
   * @description Performs final initialization.
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
  }

  /**
   * @description Gets the parent image prompts node.
   * @returns {Object} The parent image prompts node.
   * @category Hierarchy
   */
  imagePrompts () {
    return this.parentNode();
  }

  /**
   * @description Gets the ImaginePro service.
   * @returns {Object} The ImaginePro service.
   * @category Service
   */
  service () {
    return ImagineProService.shared();
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
   * @returns {Object|Promise<Object>} The action information.
   * @category Action
   */
  generateActionInfo () {
    return {
        isEnabled: this.canGenerate(),
        isVisible: true
    }
  }

  /**
   * @description Sanitizes the prompt to avoid Midjourney parameter parsing issues and ImaginePro content moderation.
   * Replaces single dashes that could be interpreted as parameters with safe alternatives.
   * Also replaces words that trigger false positives in ImaginePro's overly aggressive content filter.
   * @param {string} prompt - The raw prompt text
   * @returns {string} The sanitized prompt
   * @category Utility
   */
  sanitizePromptForMidjourney (prompt) {
    // Replace dash followed by space with comma to avoid parameter interpretation
    prompt = prompt.replace(/\s-\s/g, ', ');
    
    // Also replace em-dash and en-dash with safe alternatives
    prompt = prompt.replace(/—/g, ', ');
    prompt = prompt.replace(/–/g, ', ');
    
    // Handle ImaginePro's overly aggressive content moderation
    // Replace problematic words that are falsely flagged in fantasy/game contexts
    // These replacements maintain the meaning while avoiding false positive rejections
    prompt = prompt
      .replace(/\bstone flesh\b/gi, 'stone surface') // "stone flesh" -> "stone surface" (for golems)
      .replace(/\bflesh\b/gi, 'form') // Generic "flesh" -> "form" as fallback
      .replace(/\bnaked\b/gi, 'bare') // "naked" -> "bare" (for weapons, etc.)
      .replace(/\bkill\b/gi, 'defeat') // "kill" -> "defeat" (for combat descriptions)
      .replace(/\bblood\b/gi, 'crimson') // "blood" -> "crimson" (for visual descriptions)
      .replace(/\bgore\b/gi, 'battle damage') // "gore" -> "battle damage"
      .replace(/\bcorpse\b/gi, 'fallen figure') // "corpse" -> "fallen figure"
      .replace(/\bdead\b/gi, 'fallen') // "dead" -> "fallen"
      .replace(/\bmurder\b/gi, 'eliminate') // "murder" -> "eliminate"
      .replace(/\btorture\b/gi, 'torment') // "torture" -> "torment"
      .replace(/\bsexy\b/gi, 'attractive') // "sexy" -> "attractive"
      .replace(/\bsensual\b/gi, 'graceful') // "sensual" -> "graceful"
      .replace(/\bviolent\b/gi, 'intense') // "violent" -> "intense"
      .replace(/\bbloody\b/gi, 'crimson') // "bloody" -> "crimson"
      .replace(/\bbrutal\b/gi, 'fierce'); // "brutal" -> "fierce"
    
    return prompt;
  }

  composeFullPrompt () {
    let prompt = this.prompt();
    prompt = this.sanitizePromptForMidjourney(prompt);
    
    // Append prompt suffix if provided (e.g., "--no details --no frame")
    const suffix = this.promptSuffix();
    if (suffix.trim().length > 0) {
      prompt += " " + suffix.trim();
    }
    
    // Append omnireference flags if image is provided
    // IMPORTANT: We ONLY support Midjourney V7 or later versions
    // V7 uses --oref (omnireference) and --ow (omnireference weight) parameters
    // We do NOT support V6 or earlier (which used --cref/--cw)
    if (this.omniRefImageUrl()) {
      prompt += " --oref " + this.omniRefImageUrl() + " --ow 100";
    }
    
    // Append aspect ratio
    const aspectRatio = this.aspectRatio();
    if (aspectRatio && aspectRatio !== "1:1") {
      prompt += " --ar " + aspectRatio;
    }
    
    // IMPORTANT: We require Midjourney V7 or later
    // Append version flag to ensure V7 is used
    prompt += " --v 7";
    
    console.log("composeFullPrompt: [\n" + prompt + "\n]");
    return prompt;
  }

  /**
   * @description Starts the image generation process.
   * @category Process
   */
  async start () {
    this.setCompletionPromise(Promise.clone());
    this.setError(null);
    this.setStatus("submitting task...");
    this.sendDelegateMessage("onImagePromptStart", [this]);

    const apiKey = await this.service().apiKeyOrUserAuthToken();
    const endpoint = 'https://api.imaginepro.ai/api/v1/nova/imagine';
    
    const bodyJson = {
      prompt: this.composeFullPrompt(),
      process_mode: this.processMode()
    };
    
    // IMPORTANT: Always use proxy for ImaginePro API requests:
    // 1. ACCOUNTING: Tracks API usage for user billing
    // 2. AUTHENTICATION: Handles API key management securely
    // 3. CORS: Ensures proper headers for cross-origin requests
    const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);

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
      
      if (request.hasError()) {
        throw request.error();
      }

      if (request.isSuccess()) {
        const responseJson = JSON.parse(request.responseText());
        const taskId = responseJson.task_id || responseJson.messageId;
        if (taskId) {
            this.addGenerationForTaskId(taskId);
        } else {
            throw new Error("No task_id or messageId returned from ImaginePro");
        }
      }
    } catch (error) {
      this.onError(error);
    }
    return this.completionPromise();
  }

  addGenerationForTaskId (taskId) {
    this.setStatus("task submitted, awaiting completion...");
    const generation = this.generations().add();
    generation.setTaskId(taskId);
    generation.setDelegate(this);
    generation.startPolling();
  }

  /**
   * @description Handles errors during image generation.
   * @param {Error} error - The error object.
   * @category Process
   */
  onError (error) {
    assert(Type.isError(error), "error value passed to onError is not an Error");
    console.error(this.logPrefix(), error.message);
    this.setError(error);
    this.setStatus("ERROR: " + error.message);
    this.sendDelegateMessage("onImagePromptError", [this]);
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
    this.sendDelegateMessage("onImagePromptImageLoaded", [this, aiImage]);
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
    this.sendDelegateMessage("onImagePromptImageError", [this, aiImage]);
    this.onEnd();
  }

  /**
   * @description Handles the end of the image generation process.
   * @category Process
   */
  onEnd () { // end of request to being task
    this.sendDelegateMessage("onImagePromptEnd", [this]);
    if (this.error()) {
        // Pass the error object to the reject function
        this.completionPromise().callRejectFunc(this.error());
    } else {
        this.completionPromise().callResolveFunc(this);
    }
  }

  // --- Delegate methods from ImagineProImageGeneration ---

  /**
   * @description Handles successful generation start.
   * @param {Object} generation - The generation object.
   * @category Delegation
   */
  onImageGenerationStart (generation) {
    this.setStatus("Generation polling started...");
    this.sendDelegateMessage("onImagePromptGenerationStart", [this, generation]);
  }

  /**
   * @description Handles generation completion with images.
   * @param {Object} generation - The generation object.
   * @category Delegation
   */
  onImageGenerationEnd (generation) {    
    // Check if generation was successful and has images
    if (generation.status() === "completed" && generation.images().subnodes().length > 0) {
      this.setStatus("Generation complete - copying images...");
      
      // Copy images from generation to our images collection
      const generationImages = generation.images().subnodes();
      for (const genImage of generationImages) {
        const image = this.images().add();
        image.dataURL(genImage.url());
        if (genImage.hasLoaded()) {
          // Copy the loaded image data
          //image.setImageUrl(genImage.imageUrl());
          image.setDataURL(genImage.dataUrl());
        } else {
          // Set up delegate and fetch if not loaded
          image.setDelegate(this);
          image.fetch();
        }
      }
      
      this.setStatus("Images copied from generation");
      this.sendDelegateMessage("onImagePromptSuccess", [this]);
    } else if (generation.error()) {
      this.onError(new Error(generation.error()));
    } else {
      // More detailed status message
      const actualStatus = generation.status();
      const imageCount = generation.images().subnodes().length;
      this.setStatus(`Generation ended without images (status: ${actualStatus}, images: ${imageCount})`);
    }
    
    this.onEnd();
  }

  /**
   * @description Handles generation errors.
   * @param {Object} generation - The generation object.
   * @category Delegation
   */
  onImageGenerationError (generation) {
    const error = generation.error();
    let errorMessage = error ? error.message || error : "Generation failed";
    
    // Add more context to timeout errors
    if (errorMessage.includes("timeout")) {
      errorMessage += ". This may be due to high load on ImaginePro's servers. Please try again in a few moments.";
    }
    
    console.error(this.logPrefix(), "Image generation failed:", errorMessage);
    console.error(this.logPrefix(), "Task ID:", generation.taskId());
    
    this.onError(new Error(errorMessage));
  }

  /**
   * @description Handles individual image loading from generation.
   * @param {Object} generation - The generation object.
   * @param {Object} aiImage - The loaded AI image object.
   * @category Delegation
   */
  onImageGenerationImageLoaded (/*generation, aiImage*/) {
    this.updateStatus();
    //this.sendDelegateMessage("onImagePromptImageLoaded", [this, aiImage]);
  }

  /**
   * @description Handles individual image errors from generation.
   * @param {Object} generation - The generation object.
   * @param {Object} aiImage - The AI image object that failed to load.
   * @category Delegation
   */
  onImageGenerationImageError (generation, aiImage) {
    this.updateStatus();
    this.sendDelegateMessage("onImagePromptImageError", [this, aiImage]);
  }

  // --- SvXhrRequest Delegate Methods ---

  /**
   * @description Called when the request begins.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
  onRequestBegin (/*request*/) {
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
  onRequestSuccess (/*request*/) {
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
  onRequestAbort (/*request*/) {
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
  onRequestComplete (/*request*/) {
    // Final cleanup can be done here if needed
  }

  /**
   * @description Updates the status of the image prompt.
   * @category Status
   */
  updateStatus () {
    /*
    const s = this.images().status();
    if (s) {
      this.setStatus(s);
    }
      */
  }

  /**
   * @description Shuts down the image prompt and its associated images.
   * @returns {ImagineProImagePrompt} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    this.images().subnodes().forEach(image => image.shutdown());
    return this;
  }

}.initThisClass());