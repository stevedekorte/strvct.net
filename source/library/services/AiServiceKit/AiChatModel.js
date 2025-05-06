"use strict";

/**
 * @module library.services.AiServiceKit
 */

/**
 * @class AiChatModel
 * @extends BMSummaryNode
 * @classdesc Represents an AI chat model with configurable properties and methods.
 */
(class AiChatModel extends BMSummaryNode {
  /**
   * Initializes the prototype slots for the AiChatModel.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {AiService} service - The AI service associated with this model.
     * @category Service
     */
    {
      const slot = this.newSlot("service", null);
      slot.setSlotType("AiService");
    }

    /**
     * @member {string} modelName - The name of the AI model.
     * @category Model Information
     */
    {
      const slot = this.newSlot("modelName", null);
      slot.setLabel("name");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} inputTokenLimit - The maximum number of input tokens allowed by the model.
     * @category Model Configuration
     */
    {
      const slot = this.newSlot("inputTokenLimit", 8000);
      slot.setLabel("input token limit");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} outputTokenLimit - The maximum number of output tokens allowed by the model.
     * @category Model Configuration
     */
    {
      const slot = this.newSlot("outputTokenLimit", 8000);
      slot.setLabel("output token limit");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} temperature - The temperature parameter for AI generation.
     * @category Configuration
     */
    {
      const slot = this.newSlot("supportsTemperature", true); // 0-1, higher = more creative // default 0.7
      slot.setLabel("supports temperature");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Boolean");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} topP - The top_p parameter for AI generation.
     * @category Configuration
     */
    {
      const slot = this.newSlot("supportsTopP", true); // 0-1, higher = more diverse // top_p on Claude3 // default 0.8
      slot.setLabel("supports top probability tokens");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Boolean");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {boolean} canStream - Whether the model supports streaming.
     * @category Configuration
     */
    {
      const slot = this.newSlot("canStream", true);
      slot.setLabel("supports streaming");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Boolean");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {Object} extraHeaders - Additional headers to be sent with the request.
     * @category Configuration
     */
    {
      const slot = this.newSlot("extraHeaders", null);
      slot.setSlotType("Object");
      slot.setIsSubnodeField(false);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }


  /**
   * Performs final initialization of the AiChatModel.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setTitle("AI Model");
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
  }

  /**
   * Gets the service associated with this model.
   * @returns {AiService|Object} The service or parent node's parent node.
   * @category Service
   */
  service () {
    if (this._service) {
      return this._service;
    }
    const models = this.parentNode();
    if (models) {
      const service = models.parentNode();
      if (service) {
        return service;
      }
    }
    return null;
  }

  /**
   * Gets the subtitle for the model.
   * @returns {string} The model name.
   * @category Model Information
   */
  subtitle () {
    const service = this.service();
    if (service) {
      const serviceName = service.title().before("Service");
      return serviceName + " - " + this.modelName();
    }
    return "no service!";
  }

  /**
   * Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the key is valid, false otherwise.
   * @category Authentication
   */
  validateKey (s) {
    return s.startsWith("sk-");
  }

  /**
   * Checks if the model has a valid API key.
   * @returns {boolean} True if the API key is valid, false otherwise.
   * @category Authentication
   */
  hasApiKey () {
    return this.apiKey() && this.apiKey().length > 0 && this.validateKey(this.apiKey());
  };

  /**
   * Sets the model properties from a JSON object.
   * @param {Object} json - The JSON object containing model properties.
   * @returns {AiChatModel} The current instance.
   * @category Model Configuration
   */
  setJson (json, jsonPathComponents = []) {
    assert(json.name, "Expected name property available at JSON path: " + jsonPathComponents.join("/"));
    this.setModelName(json.name);

    if (json.title) {
      this.setTitle(json.title);
    } else {
      this.setTitle(json.name);
    }

    if (json.note) {
      this.setSubtitle(json.note);
    }

    const cw = json.inputTokenLimit;
    this.setInputTokenLimit(cw);

    //debugger;
    const otl = json.outputTokenLimit;
    if (!Type.isUndefined(otl)) {
      this.setOutputTokenLimit(otl);
    }
    //console.log(">>>>>>>>>>>>>>>> " + this.title() + " outputTokenLimit:" + this.outputTokenLimit());


    const t = json.supportsTemperature;
    if (!Type.isUndefined(t)) {
      this.setSupportsTemperature(t);
    } else {
      this.setSupportsTemperature(true);
    }
    //console.log(">>>>>>>>>>>>>>>> " + this.title() + " supportsTemperature:" + this.supportsTemperature());

    const tp = json.supportsTopP;
    if (!Type.isUndefined(tp)) {
      this.setSupportsTopP(tp);
    } else {
      this.setSupportsTopP(true);
    } 

    const cs = json.canStream;
    if (!Type.isUndefined(cs)) {
      this.setCanStream(cs);
    } else {
      this.setCanStream(true);
    }

    const eh = json.extraHeaders;
    if (!Type.isUndefined(eh)) {
      this.setExtraHeaders(eh);
    } else {
      this.setExtraHeaders(null);
    }

    //console.log("--------------" + this.title() + " supportsTemperature:" + this.supportsTemperature() + " supportsTopP:" + this.supportsTopP());
    return this;
  }

  /**
   * Generates a summary of the model.
   * @returns {string} A formatted string containing the model name and context window size.
   * @category Model Information
   */
  summary () {
    const cw = NumberFormatter.clone().setValue(this.inputTokenLimit()).setSignificantDigits(2).formattedValue();
    return this.modelName() + " (" + cw + ")\n";
  }

}.initThisClass());