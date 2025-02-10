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
          "name": "chatgpt-4o-latest",
          "title": "OpenAI ChatGPT 4o",
          "note": "The chatgpt-4o-latest model version continuously points to the version of GPT-4o used in ChatGPT, and is updated frequently, when there are significant changes.",
          "contextWindow": 128000
      },
      {
          "name": "o1-preview",
          "title": "OpenAI ChatGPT o1-preview",
          "note": "Points to the most recent snapshot of the o1 model.",
          "contextWindow": 128000
      }
      /*
      {
          "name": "gpt-4-1106-preview",
          "title": "OpenAI ChatGPT 4o",
          "note": "better instruction following",
          "contextWindow": 128000
      },
      {
          "name": "gpt-4-turbo",
          "title": "OpenAI ChatGPT 4 Turbo",
          "contextWindow": 128000
      },
      {
          "name": "gpt-4-turbo-2024-04-09",
          "title": "OpenAI ChatGPT 4 Turbo",
          "contextWindow": 128000
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

}.initThisClass());