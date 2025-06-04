"use strict";

/**
 * @module library.services.Leonardo.Text_to_Image
 */

/**
 * @class LeonardoImagePrompt
 * @extends SvSummaryNode
 * @classdesc Represents an Leonardo image prompt for generating images using Leonardo models.

Overview:

LeonardoImagePrompt:
 - we compose the request body (including character and style references)
- we send a POST request to the /generations endpoint
- we get a generation id in the response
- we create a LeonardoImageGeneration to poll for the status of the generation

LeonardoImageGeneration:
- polls for the status of the generation
- when the generation is complete, we get the image urls
- we create LeonardoImage nodes and add set their urls

LeonardoImage:
- fetches the image url



Example generation body json:

{
  "modelId": "aa77f04e-3eec-4034-9c07-d0f619684628",
  "prompt": "A cinematic oil-painting of a cat lit by golden-hour rim light, ultra-realistic, 8-k detail",
  "negativePrompt": "blurry, low quality, artifacts",
  "width": 768,
  "height": 768,
  "num_images": 4,
  "seed": 465788672,
  "steps": 30,
  "guidanceScale": 7,
  "scheduler": "LEONARDO",          // KLMS, EULER_ANCESTRAL_DISCRETE, etc.
  "alchemy": true,                 // enable SDXL Alchemy
  "presetStyle": "CINEMATIC",      // built-in look (optional)
  "photoReal": true,
  "photoRealVersion": "v2",
  "controlnets": [
    {
      "initImageId": "123e4567-e89b-12d3-a456-426614174000",
      "initImageType": "UPLOADED", // or "GENERATED"
      "preprocessorId": 67,        // Style Reference
      "strengthType": "High"       // Low | Mid | High | Max
    }
  ]
}


  Example response:

  {
  "sdGenerationJob": {
    "generationId": "bc01981-3312-4229-a2de-fa7d52988290",
    "apiCreditCost": 11
  }
}

  Next, create a LeonardoImageGeneration node with the generation id
  and poll for the status of the generation:

  GET /generations/5ea7492a-8499-4706-9e04-1a0bcb5cf6e8

  Example response:

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
(class LeonardoImagePrompt extends SvSummaryNode {  

  usableModelNames () {
    return ["Phoenix 1.0", "Phoenix 0.9", "Kino XL", "Diffusion XL", "Vision XL", "Anime XL", "Lightning XL", "SDXL 1.0", "SDXL 0.9", "AlbedoBase XL", "RPG v5", "3D Animation", "DreamShaper v7"];
  }

  validModelIdItems () {
    return [
      { "value": "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3", "label": "Phoenix 1.0",        "subtitle": "Flagship founder model" },
     // { "value": "6b645e3a-d64f-4341-a6d8-7a3690fbf042", "label": "Phoenix 0.9",        "subtitle": "Earlier Phoenix preview" },
      //{ "value": "b2614463-296c-462a-9586-aafdb8f00e36", "label": "Flux Dev",           "subtitle": "Fast SDXL-based dev build" },
      //{ "value": "1dd50843-d653-4516-a8e3-f0238ee453ff", "label": "Flux Schnell",       "subtitle": "Ultra-speed draft mode" },
      { "value": "aa77f04e-3eec-4034-9c07-d0f619684628", "label": "Kino XL",            "subtitle": "Cinematic SDXL finetune" },
      { "value": "1e60896f-3c26-4296-8ecc-53e2afecc132", "label": "Diffusion XL",       "subtitle": "Versatile SDXL core" },
      { "value": "5c232a9e-9061-4777-980a-ddc8e65647c6", "label": "Vision XL",          "subtitle": "Photoreal-leaning SDXL" },
      { "value": "e71a1c2f-4f80-4800-934f-2c68979d8cc8", "label": "Anime XL",           "subtitle": "Stylised anime output" },
      { "value": "b24e16ff-06e3-43eb-8d33-4416c2d75876", "label": "Lightning XL",       "subtitle": "Low-step, fast drafts" },
      { "value": "16e7060a-803e-4df3-97ee-edcfa5dc9cc8", "label": "SDXL 1.0",           "subtitle": "Vanilla SDXL baseline" },
      { "value": "b63f7119-31dc-4540-969b-2a9df997e173", "label": "SDXL 0.9",           "subtitle": "Legacy SDXL beta" },
      { "value": "2067ae52-33fd-4a82-bb92-c2c55e7d2786", "label": "AlbedoBase XL",      "subtitle": "PBR texture generator" },
      { "value": "f1929ea3-b169-4c18-a16c-5d58b4292c69", "label": "RPG v5",             "subtitle": "Comic-style RPG art" },
      { "value": "d69c8273-6b17-4a30-a13e-d6637ae1c644", "label": "3D Animation",       "subtitle": "Toon-shaded renders" },
      { "value": "ac614f96-1082-45bf-be9d-757f2d31c174", "label": "DreamShaper v7",     "subtitle": "Popular SD1.5 finetune" }
    ]
  }    

  validPresetStyleItems () {
    return [
      { "value": "NONE",               "label": "None",        "subtitle": "Default, no stylistic bias" },
      { "value": "LEONARDO",           "label": "Leonardo",    "subtitle": "Balanced house visual style" },
      { "value": "ANIME",              "label": "Anime",       "subtitle": "Manga-inspired cel shading" },
      { "value": "CREATIVE",           "label": "Creative",    "subtitle": "Looser, experimental visuals" },
      { "value": "DYNAMIC",            "label": "Dynamic",     "subtitle": "High-energy, vivid colors" },
      { "value": "ENVIRONMENT",        "label": "Environment", "subtitle": "Scenic landscapes emphasis" },
      { "value": "GENERAL",            "label": "General",     "subtitle": "Versatile all-purpose look" },
      { "value": "ILLUSTRATION",       "label": "Illustration","subtitle": "Painterly 2D artwork feel" },
      { "value": "PHOTOGRAPHY",        "label": "Photo",       "subtitle": "Realistic photographic tone" },
      { "value": "RAYTRACED",          "label": "Raytraced",   "subtitle": "CGI with light realism" },
      { "value": "RENDER_3D",          "label": "Render3D",    "subtitle": "Clean 3D model render" },
      { "value": "SKETCH_BW",          "label": "SketchBW",    "subtitle": "Black-white pencil sketch" },
      { "value": "SKETCH_COLOR",       "label": "SketchColor", "subtitle": "Colored pencil sketch" },
      { "value": "BOKEH",              "label": "Bokeh",       "subtitle": "Shallow-depth soft lights" },
      { "value": "CINEMATIC",          "label": "Cinematic",   "subtitle": "Film-grade dramatic lighting" },
      { "value": "CINEMATIC_CLOSEUP",  "label": "Closeup",     "subtitle": "Tight cinematic framing" },
      { "value": "FASHION",            "label": "Fashion",     "subtitle": "Editorial haute-couture vibe" },
      { "value": "FILM",               "label": "Film",        "subtitle": "Analog grainy movie look" },
      { "value": "FOOD",               "label": "Food",        "subtitle": "Appetizing culinary styling" },
      { "value": "HDR",                "label": "HDR",         "subtitle": "High-dynamic-range contrast" },
      { "value": "LONG_EXPOSURE",      "label": "LongExposure","subtitle": "Motion-blur light trails" },
      { "value": "MACRO",              "label": "Macro",       "subtitle": "Extreme close-up detail" },
      { "value": "MINIMALISTIC",       "label": "Minimal",     "subtitle": "Clean sparse composition" },
      { "value": "MONOCHROME",         "label": "Monochrome",  "subtitle": "Single-hue tonal range" },
      { "value": "MOODY",              "label": "Moody",       "subtitle": "Dark dramatic atmosphere" },
      { "value": "NEUTRAL",            "label": "Neutral",     "subtitle": "Balanced, subdued palette" },
      { "value": "PORTRAIT",           "label": "Portrait",    "subtitle": "Studio headshot aesthetics" },
      { "value": "RETRO",              "label": "Retro",       "subtitle": "Vintage nostalgic styling" },
      { "value": "STOCK_PHOTO",        "label": "Stock",       "subtitle": "Clean corporate stock feel" },
      { "value": "UNPROCESSED",        "label": "Unprocessed", "subtitle": "Raw sensor-like output" },
      { "value": "VIBRANT",            "label": "Vibrant",     "subtitle": "Bright saturated colors" }
    ]
  }

  initPrototypeSlots () {

    /**
     * @member {string} prompt
     * @description The prompt text for image generation.
     * @category Input
     */
    {
      const slot = this.newSlot("prompt", "cat on a beach");
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    /**
     * @member {string} ttiModel
     * @description The model to use for text-to-image generation.
     * @category Configuration
     */
    {
      const validItems = this.validModelIdItems();
      const slot = this.newSlot("ttiModel", null);
      slot.setInspectorPath("");
      slot.setLabel("Text to Image Model");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setValidItems(validItems); 
      slot.setInitValue(validItems.first().value);
      slot.setIsSubnodeField(true);
    }


    {
      const validItems = this.validPresetStyleItems();
      const slot = this.newSlot("presetStyle", null);
      slot.setInspectorPath("");
      slot.setLabel("preset style");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setValidItems(validItems);
      slot.setInitValue(validItems.first().value);
      slot.setIsSubnodeField(true);
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
      slot.setValidValues([1, 2, 3, 4]) 
      //slot.setIsSubnodeField(true)
    }

    //  512, 1024

    /**
     * @member {string} imageWidth
     * @description The width of the generated image.
     * @category Configuration
     */
    {
      const validValues = [512, 1024];
      const slot = this.newSlot("imageWidth", null);
      slot.setInspectorPath("");
      slot.setLabel("image width");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setValidValues(validValues);
      slot.setInitValue(validValues.first());
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {string} imageHeight
     * @description The height of the generated image.
     * @category Configuration
     */
    {
      const validValues = [512, 1024];
      const slot = this.newSlot("imageHeight", null);
      slot.setInspectorPath("");
      slot.setLabel("image height");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setValidValues(validValues);
      slot.setInitValue(validValues.first());
      slot.setIsSubnodeField(true);
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
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
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
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      //slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
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

    /**
     * @member {LeonardoImageGeneration} generation
     * @description The generation node.
     * @category Output
     */
    {
      const slot = this.newSlot("generation", null);
      slot.setFinalInitProto(LeonardoImageGeneration);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("LeonardoImageGeneration");
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
    return this.type() + "\n" + this.status();
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

  hasPrompt () {
    return this.prompt().length !== 0;
  }

  /**
   * @description Checks if image generation can be performed.
   * @returns {boolean} True if generation can be performed, false otherwise.
   * @category Validation
   */
  canGenerate () {
    return !this.xhr().isActive() && this.hasPrompt();
  }

  /**
   * @description Initiates the image generation process.
   * @category Action
   */
  generate () {
    this.start();
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

  // --- start generation ---

  setupXhrRequest () {
    const endpoint = 'https://cloud.leonardo.ai/api/rest/v1/generations';
    const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);
    const apiKey = this.service().apiKeyOrUserAuthToken();

    const xhr = this.xhrRequest();
    xhr.clear();
    xhr.setDelegate(this);
    xhr.setUrl(proxyEndpoint);
    xhr.setMethod("POST");
    xhr.setHeaders({
      "Authorization": `Bearer ` + apiKey,
      "Content-Type": 'application/json'
    });

    const body = {
      modelId: this.ttiModel(),
      prompt: this.prompt(),
      presetStyle: this.presetStyle(),
      width: this.imageWidth(),
      height: this.imageHeight(),
      num_images: this.imageCount()
    }

    /*
    if (this.presetStyle() !== "NONE") {
      body.presetStyle = this.presetStyle(); // this is optional
    }
    */

    xhr.setBody(JSON.stringify(body));
  }

  /**
   * @description Starts the image generation process.
   * @category Process
   */
  async start () {
    this.setError("");
    this.setStatus("Sending Generation Request...");
    this.sendDelegate("onImagePromptStart", [this]);

    this.setupXhrRequest();

    try {
      await this.xhrRequest().asyncSend(); // we use onRequestError instead of throwing an error
      // handle the rest in the delegate methods
      // but just in case there is an unhandled error, we'll catch it here
    } catch (error) {
      this.onError(error);
      // this error was unhandled, so we'll rethrow it so it gets logged and doesn't go unnoticed
      error.rethrow();
    }
  }

  // -- delegate methods from SvXhrRequest --

  onRequestSuccess (request) {
    /*
      HTTP/1.1 200 OK
      content-type: application/json

      {
        "sdGenerationJob": {
          "generationId": "5ea7492a-8499-4706-9e04-1a0bcb5cf6e8",
          "apiCreditCost": 11          // how many credits this request just burned
        }
      }
  */
    const resultData = request.responseText();
    const json = JSON.parse(resultData);

    if (json.error) {
      this.onError(json.error);
      return;
    }
    this.setStatus("Generation Response Received");

    const generationId = json.sdGenerationJob.generationId;
    const generationNode = this.generation();
    generationNode.setGenerationId(generationId);
    generationNode.setDelegate(this);
    generationNode.startPolling();
  }

  /**
   * @description Handles errors during image generation.
   * @param {Error} error - The error object.
   * @category Process
   */
  onRequestFailure (request) {
    const s = "ERROR: " + request.error().message;
    console.error(s);
    this.setError(request.error().message);
    this.setStatus(s);
    this.sendDelegate("onImagePromptError", [this]);
    this.onEnd();
  }

  // -- poll for generation status --

  pollForGenerationStatus () {
    const status = this.status();
    if (status === "fetching response...") {
      this.pollForGenerationStatus();
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