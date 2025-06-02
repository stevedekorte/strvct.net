/**
 * @module library.services.OpenAI
 */

/**
 * @class OpenAiService
 * @extends AiService
 * @classdesc OpenAiService is a SvSummaryNode that holds the API key and subnodes for the various OpenAI services.
 * 
 * Example:
 * 
 * OpenAiService.shared().setApiKey("sk-1234567890");
 * const hasApiKey = OpenAiService.shared().hasApiKey();
 */
"use strict";

(class OpenAiService extends AiService {

  /**
   * @static
   * @description Initializes the class and sets it as a singleton.
   * @category Initialization
   */
  static initClass () {
    this.setIsSingleton(true);
  }

  serviceInfo () {
    return {
    };
  }

  /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model objects with name, note, and contextWindow properties.
   * @category Model Configuration
   */
  modelsJson () {
    return [
    ];
  }
  
  /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {OpenAiImagePrompts} imagesPrompts
     * @category Image Generation
     */
    {
      const slot = this.overrideSlot("imagesPrompts", null);
      slot.setFinalInitProto(OpenAiImagePrompts);
      slot.setIsSubnode(true);
    }
  }

  /**
   * @description Performs final initialization steps for the instance.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setTitle("Leonardo.ai");
  }

  /**
   * @description Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the key is valid, false otherwise.
   * @category Authentication
   */
  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }
  

}.initThisClass());