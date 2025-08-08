/**
 * @module library.services.PiAPI
 */

/**
 * @class PiApiService
 * @extends AiService
 * @classdesc PiApiService is a SvSummaryNode that holds the API key and subnodes for the various PiAPI services.
 * 
 * Example:
 * 
 * PiApiService.shared().setApiKey("your-piapi-key");
 * const hasApiKey = PiApiService.shared().hasApiKey();
 */
"use strict";

(class PiApiService extends AiService {

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
      "taskEndpoint": "https://api.piapi.ai/api/v1/task"
    };
  }

  /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model objects with name, note, and contextWindow properties.
   * @category Model Configuration
   */
  modelsJson () {
    return [
      {
        "name": "midjourney",
        "title": "Midjourney",
        "inputTokenLimit": 4000,
        "outputTokenLimit": 4000,
        "supportsImageGeneration": true
      }
    ];
  }
  
  /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
  initPrototypeSlots () {
    
    /**
     * @member {PiApiImagePrompts} imagesPrompts
     * @category Image Generation
     */
    {
      const slot = this.newSlot("imagesPrompts", null);
      slot.setFinalInitProto(PiApiImagePrompts);
      slot.setIsSubnode(true);
      slot.setShouldStoreSlot(true);
    }

    /**
     * @member {PiApiMidJourneyStyleTransfers} styleTransfers
     * @category Style Transfers
     */
    {
      const slot = this.newSlot("styleTransfers", null);
      slot.setFinalInitProto(PiApiMidJourneyStyleTransfers);
      slot.setIsSubnode(true);
      slot.setShouldStoreSlot(true);
    }
  }

  /**
   * @description Initializes the instance.
   * @category Initialization
   */
  init () {
    super.init();
  }

  /**
   * @description Performs final initialization steps for the instance.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setTitle(this.type().before("Service"));
  }

  /**
   * @description Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the key is valid, false otherwise.
   * @category Authentication
   */
  validateKey (s) {
    return s.length === 64 && /^[a-f0-9]+$/.test(s);
  }

}.initThisClass());