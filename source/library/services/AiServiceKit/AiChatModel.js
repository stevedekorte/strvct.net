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
   * @method
   */
  initPrototypeSlots () {
    /**
     * @property {AiService} service - The AI service associated with this model.
     */
    {
      const slot = this.newSlot("service", null);
      slot.setSlotType("AiService");
    }

    /**
     * @property {string} modelName - The name of the AI model.
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
     * @property {number} maxContextTokenCount - The maximum number of input tokens allowed by the model.
     */
    {
      const slot = this.newSlot("maxContextTokenCount", 8000);
      slot.setLabel("context window");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * Initializes the AiChatModel.
   * @method
   */
  init () {
    super.init();
  }

  /**
   * Performs final initialization of the AiChatModel.
   * @method
   */
  finalInit () {
    super.finalInit()
    this.setTitle("AI Model");
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
  }

  /**
   * Gets the service associated with this model.
   * @method
   * @returns {AiService|Object} The service or parent node's parent node.
   */
  service () {
    if (this._service) {
      return this._service;
    }
    return this.parentNode().parentNode();
  }

  /**
   * Gets the subtitle for the model.
   * @method
   * @returns {string} The model name.
   */
  subtitle () {
    return this.modelName();
  }

  /**
   * Validates the API key.
   * @method
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the key is valid, false otherwise.
   */
  validateKey (s) {
    return s.startsWith("sk-");
  }

  /**
   * Checks if the model has a valid API key.
   * @method
   * @returns {boolean} True if the API key is valid, false otherwise.
   */
  hasApiKey () {
    return this.apiKey() && this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  /**
   * Sets the model properties from a JSON object.
   * @method
   * @param {Object} json - The JSON object containing model properties.
   * @returns {AiChatModel} The current instance.
   */
  setJson (json) {
    assert(json.name);
    this.setModelName(json.name);

    if (json.title) {
      this.setTitle(json.title);
    } else {
      this.setTitle(json.name);
    }

    const cw = json.contextWindow;
    assert(Type.isNumber(cw));
    this.setMaxContextTokenCount(cw);
    return this;
  }

  /**
   * Generates a summary of the model.
   * @method
   * @returns {string} A formatted string containing the model name and context window size.
   */
  summary () {
    const cw = NumberFormatter.clone().setValue(this.maxContextTokenCount()).setSignificantDigits(2).formattedValue();

    return this.modelName() + " (" + cw + ")\n";
  }

}.initThisClass());