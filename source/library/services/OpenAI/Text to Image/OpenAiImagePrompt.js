"use strict";

/**
 * @module library.services.OpenAI.Text_to_Image
 */

/**
 * @class OpenAiImagePrompt
 * @extends BMSummaryNode
 * @classdesc Represents an OpenAI image prompt for generating images using DALL-E models.
 */
(class OpenAiImagePrompt extends BMSummaryNode {
  initPrototypeSlots () {

    /**
     * @member {string} prompt
     * @description The prompt text for image generation.
     * @category Input
     */
    {
      const slot = this.newSlot("prompt", "");
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    /**
     * @member {string} model
     * @description The DALL-E model to use for image generation.
     * @category Configuration
     */
    {
      const slot = this.newSlot("model", "gpt-image-1"); //"dall-e-3");
      slot.setInspectorPath("");
      //slot.setLabel("prompt");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setValidValues(["gpt-image-1"]); //, "dall-e-3"])
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {string} quality
     * @description The quality of the generated image.
     * @category Configuration
     */
    {
      const slot = this.newSlot("quality", "standard");
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(["standard", "hd"])
      slot.setIsSubnodeField(true)
    }

    /**
     * @member {number} imageCount
     * @description The number of images to generate.
     * @category Configuration
     */
    {
      const slot = this.newSlot("imageCount", 1);
      slot.setInspectorPath("")
      slot.setLabel("image count")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setValidValues([1]) // dall-e-3 only supports 1
      //slot.setIsSubnodeField(true)
    }

    
    /**
     * @member {string} imageSize
     * @description The size of the generated image.
     * @category Configuration
     */
    {
      const slot = this.newSlot("imageSize", "1536x1024");
      slot.setInspectorPath("")
      slot.setLabel("image size")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues([
        '1024x1024', '1024x1536', '1536x1024', 'auto'
      ])
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
      //slot.setShouldStoreSlot(true)
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
      const slot = this.newSlot("error", ""); // null or String
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      //slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
    }

    /**
     * @member {OpenAiImages} images
     * @description The generated images.
     * @category Output
     */
    {
      const slot = this.newSlot("images", null)
      slot.setFinalInitProto(OpenAiImages)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("OpenAiImages");
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
    const p = this.prompt().clipWithEllipsis(15);
    return p ? p : "Image Prompt";
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
   * @description Gets the OpenAI service.
   * @returns {Object} The OpenAI service.
   * @category Service
   */
  service () {
    //return this.imagePrompts().service()
    return UndreamedOfApp.shared().services().openAiService()
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
  generate () {
    this.start()
  }

  /**
   * @description Gets information about the generate action.
   * @returns {Object} The action information.
   * @category Action
   */
  generateActionInfo () {
    return {
        isEnabled: this.canGenerate(),
        //title: this.title(),
        isVisible: true
    }
  }

  /**
   * @description Starts the image generation process.
   * @category Process
   */
  async start () {
    this.setError("");
    this.setStatus("fetching response...");
    this.sendDelegate("onImagePromptStart", [this]);

    const apiKey = this.service().apiKeyOrUserAuthToken(); // Replace with your actual API key
    const endpoint = 'https://api.openai.com/v1/images/generations'; // DALL·E 2 API endpoint
    /*
    // dall-e 3
    const bodyJson = {
      model: this.model(), // not sure this is valid, but it's used in the python API
      prompt: this.prompt(),
      n: this.imageCount(), 
      size: this.imageSize(),
      quality: this.quality()
    };
    */

    // gpt-image-1
    const bodyJson = {
        model: this.model(), // not sure this is valid, but it's used in the python API
        prompt: this.prompt(),
        size: this.imageSize()
    };
    
    const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);

    try {
      const response = await fetch(proxyEndpoint, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ` + apiKey,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyJson)
      });

      const resultData = await response.json();

      // throw if the response is not ok
      // add a detailed error message
      if (!response.ok) {
        const error = new Error(`HTTP error! Type: ${response.type}, Status: ${response.status}, Status Text:${response.statusText}`);
        debugger;
        throw error;
      }

      // convert the base64 data to a data URL
      const base64Data = resultData.data[0].b64_json;
      const byteCharacters = atob(base64Data);
      const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const dataUrl = await blob.asyncToDataUrl();

      // create the image node and set the data URL
      const image = this.images().add();
      image.setTitle("image " + this.images().subnodeCount());
      image.onLoaded(dataUrl);

      this.onSuccess(resultData);
    } catch (error) {
      this.onError(error);
      error.rethrow();
    }
  }

  /**
   * @description Handles successful image generation.
   * @param {Object} json - The response JSON from the API.
   * @category Process
   */
  onSuccess (json) {
    this.onEnd();

/*
    this.sendDelegate("onImagePromptLoading", [this]);

    if (json.error) {
      this.setStatus("ERROR: " + json.error.message);
      return
    }
    
    // now we need load the images
    json.data.forEach(imageDict => {
      const image = this.images().add();
      //imageResult.setCreated(json.created);
      image.setTitle("image " + this.images().subnodeCount());
      image.setRevisedPrompt(imageDict.revised_prompt);
      image.setUrl(imageDict.url);
      image.fetch();
    })

    this.updateStatus()
    console.log('Success:', json.data);
    */
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
   * @returns {OpenAiImagePrompt} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    // TODO: add request ivar and abort it
    this.images().subnodes().forEach(image => image.shutdown());
    return this;
  }

}.initThisClass());