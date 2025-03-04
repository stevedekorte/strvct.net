/**
 * @module library.services.OpenAI
 */

/**
 * @class OpenAiService
 * @extends AiService
 * @classdesc OpenAiService is a BMSummaryNode that holds the API key and subnodes for the various OpenAI services.
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

  /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model objects with name, note, and contextWindow properties.
   * @category Model Configuration
   */
  modelsJson () {
    return [
      {
        "name": "gpt-4.5-preview",
        "title": "OpenAI ChatGPT 4.5 Preview",
        "note": "Latest.",
        "inputTokenLimit": 128000,
        "outputTokenLimit": 16384
      },
      {
        "name": "chatgpt-4o-latest",
        "title": "OpenAI ChatGPT 4o",
        "note": "Latest.",
        "inputTokenLimit": 128000,
        "outputTokenLimit": 16384
      },
        

      // we can't handle these non-streaming models yet (see AiRequest.js)
      /*
      {
        "name": "o1",
        "title": "OpenAI ChatGPT o1",
        "note": "Latest.",
        "inputTokenLimit": 200000,
        "supportsTemperature": false, // o1 does not support temperature
        "supportsTopP": false, // o1 does not support top_p
        "canStream": false // o1 does not support streaming
      },
      {
        "name": "o1-preview",
        "title": "OpenAI ChatGPT o1-preview",
        "note": "Latest.",
        "inputTokenLimit": 128000,
        "supportsTemperature": false, // o1 does not support temperature
        "supportsTopP": false, // o1 does not support top_p
        "canStream": false // o1 does not support streaming
      },
      {
        "name": "o1-mini",
        "title": "OpenAI ChatGPT o1-mini",
        "note": "Latest",
        "inputTokenLimit": 128000,
        "supportsTemperature": false, // o1 does not support temperature
        "supportsTopP": false, // o1 does not support top_p
        "canStream": false // o1 does not support streaming
      },
      {
        "name": "o3-mini",
        "title": "OpenAI ChatGPT o3-mini",
        "note": "Latest",
        "inputTokenLimit": 200000,
        "supportsTemperature": false, // o3 does not support temperature
        "supportsTopP": false, // o3 does not support top_p
        "canStream": false // o3 does not support streaming
      }
      */
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

    /**
     * @member {OpenAiTtsSessions} ttsSessions
     * @category Text-to-Speech
     */
    {
      const slot = this.overrideSlot("ttsSessions", null);
      slot.setFinalInitProto(OpenAiTtsSessions);
      slot.setIsSubnode(true);
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

    // model and other info is set via OpenAiService.json file
    // see: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
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

  /**
   * @description Checks if a valid API key is set.
   * @returns {boolean} True if a valid API key is set, false otherwise.
   * @category Authentication
   */
  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  /**
   * @description Fetches the models URL.
   * @returns {string} The URL for fetching models.
   * @category Models
   */
  fetchModelsUrl () {
    return "https://api.openai.com/v1/models";
  }

}.initThisClass());