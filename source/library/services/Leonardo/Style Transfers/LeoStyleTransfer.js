"use strict";

/**
 * @module library.services.Leonardo.StyleTransfers
 */

/**
 * @class LeoStyleTransfer
 * @extends SvSummaryNode
 * @classdesc How it works:
 * - takes a prompt
 * - uses OpenAiImagePrompt to generate an image
 * - uses LeonardoImagePrompt to perform a style transfer on the image
 * - stores the style transferred image as a urlData
 * - disposes of the OpenAiImagePrompt and the LeonardoImagePrompt objects
 * 
 * 
 * We need to send the following delegate messages:
 * - onImageGenerationPromptLoading
 * - onImageGenerationPromptError
 * - onImageGenerationPromptImageLoaded
 * - onImageGenerationPromptImageError
 * 
 * (the delegate will typically be a UoImageMessage)
 */


(class LeoStyleTransfer extends SvSummaryNode {
  /**
   * @description Initializes the prototype slots for the LeoStyleTransfer class.
   */
  initPrototypeSlots () {

    // prompt
    {
      const slot = this.newSlot("prompt", "");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
    }

    // OpenAI image generation prompt
    {
      const slot = this.newSlot("openAiPrompt", null);
      slot.setFinalInitProto(OpenAiImagePrompt);
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
    }

    // Leonardo style transfer prompt
    {
      const slot = this.newSlot("leonardoPrompt", null);
      slot.setFinalInitProto(LeonardoImagePrompt);
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
    }

    // Reference image for init
    {
      const slot = this.newSlot("initRefImage", null);
      slot.setFinalInitProto(LeonardoRefImage);
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
    }

    // Reference image for style
    {
      const slot = this.newSlot("styleRefImage", null);
      slot.setFinalInitProto(LeonardoRefImage);
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
    }

    // Final result data URL
    {
      const slot = this.newSlot("resultDataUrl", null);
      slot.setSlotType("String");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setIsSubnodeField(true);
      slot.setFieldInspectorViewClassName("SvImageWellField");
    }

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

    /**
     * @member {Action} startAction - The action to start style transfer.
     * @category Actions
     */
    {
      const slot = this.newSlot("startAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Start Style Transfer");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("start");
    }

    /**
     * @member {Action} setStyleImageAction - The action to set style image.
     * @category Actions
     */
    {
      const slot = this.newSlot("setStyleImageAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Set Style Image");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("selectStyleImage");
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
   * @description Gets the Leonardo service used for style transfer.
   * @returns {Object} The service.
   * @category Service
   */
  leonardoService () {
    return LeonardoService.shared();
  }

  /**
   * @description Gets the OpenAI service used for initial generation.
   * @returns {Object} The service.
   * @category Service
   */
  openAiService () {
    return OpenAiService.shared();
  }


  setupInitialPrompt () {
    const openAiPrompt = this.openAiPrompt();
    openAiPrompt.setPrompt(this.prompt());
    openAiPrompt.setTtiModel("gpt-image-1");
    //openAiPrompt.setImageSize("1536x1024");
    openAiPrompt.setQuality("standard");
    openAiPrompt.setImageCount(1);
    return openAiPrompt;
  }

  setupLeonardoPrompt () {
    const leonardoPrompt = this.leonardoPrompt();
    leonardoPrompt.setPrompt(this.prompt());
    const modelId = LeonardoImagePrompt.modelIdForName("Phoenix 1.0");
    leonardoPrompt.setTtiModel(modelId);
    leonardoPrompt.setImageWidth(1024);
    leonardoPrompt.setImageHeight(512);
    leonardoPrompt.setImageCount(1);
    leonardoPrompt.setInitImageStrength(0.5); // Medium strength for style transfer
    leonardoPrompt.setStrengthType("Mid");
    return leonardoPrompt;
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
   * @description Starts the style transfer process.
   * @returns {Promise<void>}
   * @category Actions
   */
  async start () {
    try {
      this.setError("");
      this.setStatus("starting style transfer...");
      
      // Validate we have a prompt
      if (!this.prompt() || this.prompt().trim() === "") {
        throw new Error("Prompt is required");
      }

      // Setup prompts
      const openAiPrompt = this.setupInitialPrompt();
      const leonardoPrompt = this.setupLeonardoPrompt();

      // Step 1: Generate initial image with OpenAI
      this.setStatus("generating initial image with OpenAI...");
      this.sendDelegate("onImageGenerationPromptLoading");
      
      openAiPrompt.setDelegate(this);
      await openAiPrompt.generate();
      
      if (!openAiPrompt.images() || openAiPrompt.images().subnodeCount() === 0) {
        throw new Error("Failed to generate initial image");
      }

      // Get the generated image data URL
      const openAiImage = openAiPrompt.images().subnodes().last();
      const initialDataUrl = openAiImage.imageUrl();
      
      if (!initialDataUrl) {
        throw new Error("Failed to get image data URL from OpenAI");
      }

      // Step 2: Upload initial image to Leonardo as reference
      this.setStatus("uploading initial image to Leonardo...");
      const initRefImage = this.initRefImage();
      initRefImage.setDataUrl(initialDataUrl);
      initRefImage.setImageLabel("Initial image from OpenAI");
      
      await initRefImage.getIdAndUpload();
      
      if (!initRefImage.hasInitImageId()) {
        throw new Error("Failed to upload initial image to Leonardo");
      }

      // Step 3: Generate style reference if we have a style ref image
      assert(this.styleRefImage(), "Style reference image is required");
      assert(this.styleRefImage().hasInitImageId(), "Style reference image must have an init image id");
      const styleImageId = this.styleRefImage().initImageId();

      // Step 4: Perform style transfer with Leonardo
      this.setStatus("performing style transfer with Leonardo...");
      leonardoPrompt.setInitImageId(initRefImage.initImageId());
      
      if (styleImageId) {
        leonardoPrompt.setStyleImageId(styleImageId);
      }
      
      leonardoPrompt.setDelegate(this);
      await leonardoPrompt.generate();
      
      if (!leonardoPrompt.generation()) {
        throw new Error("Failed to generate style transfer image");
      }

      // Step 5: Get the final result
      const leonardoGeneration = leonardoPrompt.generation();
      if (!leonardoGeneration) {
        throw new Error("No generation object found");
      }
      
      // Wait for images to be loaded
      const finalImage = leonardoGeneration.images().subnodes().last();
      if (!finalImage) {
        throw new Error("No images found in generation");
      }
      
      //debugger;

      if (finalImage && finalImage.imageUrl()) {
        this.setResultDataUrl(finalImage.imageUrl());
        this.setStatus("style transfer complete");
        
        //this.sendDelegate("onImageGenerationPromptImageLoaded");
      } else {
        throw new Error("Failed to get final image data URL from Leonardo");
      }
      this.sendDelegate("onImagePromptImageLoaded", [this, finalImage]);
      this.sendDelegate("onImagePromptEnd", [this]);

    } catch (error) {
      this.setError(error.message);
      this.setStatus("failed");
      
      this.sendDelegate("onImagePromptError");
    }
  }

  // Delegate methods from OpenAI prompt
  onImagePromptCompleted (/*prompt*/) {
    // Called when OpenAI finishes generating
    console.log("OpenAI image generation completed");
  }

  onImagePromptError (prompt) {
    // Called if OpenAI fails
    this.setError("OpenAI generation failed: " + prompt.error());
    this.setStatus("failed");
  }

  // Delegate methods from Leonardo prompt  
  onLeonardoImagePromptCompleted (/*prompt*/) {
    // Called when Leonardo finishes
    console.log("Leonardo style transfer completed");
  }

  onLeonardoImagePromptError (prompt) {
    // Called if Leonardo fails
    this.setError("Leonardo style transfer failed: " + prompt.error());
    this.setStatus("failed");
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
   * @description Checks if the style transfer process can be started.
   * @returns {boolean} True if can start, false otherwise.
   * @category Status
   */
  canStart () {
    return this.prompt() !== null && this.prompt().trim() !== "" && this.status() !== "processing";
  }

  /**
   * @description Checks if the style transfer has a result.
   * @returns {boolean} True if has result, false otherwise.
   * @category Status
   */
  hasResult () {
    return this.resultDataUrl() !== null;
  }

  /**
   * @description Shuts down the style transfer process.
   * @returns {this} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    if (this.openAiPrompt()) {
      this.openAiPrompt().shutdown();
    }
    if (this.leonardoPrompt()) {
      this.leonardoPrompt().shutdown();
    }
    return this;
  }

  /**
   * @description Selects a style image from file.
   * @returns {Promise<void>}
   * @category Actions
   */
  async selectStyleImage () {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      const fileSelected = new Promise((resolve, reject) => {
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          } else {
            reject(new Error('No file selected'));
          }
        };
      });
      
      input.click();
      const dataUrl = await fileSelected;
      
      if (!this.styleRefImage()) {
        this.setStyleRefImage(LeonardoRefImage.clone());
      }
      
      this.styleRefImage().setDataUrl(dataUrl);
      
    } catch (error) {
      console.error("Failed to select style image:", error);
    }
  }

  /**
   * @description Gets action info for the start action.
   * @returns {Object} Action info.
   * @category Actions
   */
  startActionInfo () {
    return {
      isEnabled: this.canStart(),
      isVisible: true
    };
  }

  /**
   * @description Gets action info for the set style image action.
   * @returns {Object} Action info.
   * @category Actions
   */
  setStyleImageActionInfo () {
    return {
      isEnabled: true,
      isVisible: true
    };
  }

  /**
   * @description Resets the style transfer for a new attempt.
   * @returns {this} The current instance.
   * @category Actions
   */
  reset () {
    this.setError("");
    this.setStatus("");
    this.setResultDataUrl(null);
    
    if (this.openAiPrompt()) {
      this.openAiPrompt().shutdown();
    }
    
    if (this.leonardoPrompt()) {
      this.leonardoPrompt().shutdown();
    }
    
    return this;
  }

  /**
   * @description Gets a descriptive subtitle based on current state.
   * @returns {string} The subtitle.
   * @category UI
   */
  subtitle () {
    if (this.hasError()) {
      return "Error: " + this.error();
    }
    
    if (this.hasResult()) {
      return "Complete";
    }
    
    if (this.status()) {
      return this.status();
    }
    
    if (this.styleRefImage() && this.styleRefImage().hasDataUrl()) {
      return "Style image ready";
    }
    
    return "Ready";
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

}.initThisClass());