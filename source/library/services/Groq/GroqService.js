/**
 * @module library.services.Groq
 */

/**
 * @class GroqService
 * @extends AiService
 * @classdesc Holds API key and subnodes for the various Groq services.
 */
(class GroqService extends AiService {

  /**
   * @static
   * @description Initializes the class
   * @category Initialization
   */
  static initClass () {
    this.setIsSingleton(true);
  }

  /**
   * @description Returns the JSON representation of available models
   * @returns {Array} An array of model objects
   * @category Model Management
   */
  modelsJson () {
    return [
      {
        "name": "llama-3.1-405b-reasoning",
        "contextWindow": 131072 
      }
      /*
      {
          "name": "llama-3.1-70b-versatile",
          "contextWindow": 131072
      },
      {
          "name": "llama-3.1-8b-instant",
          "contextWindow": 131072
      },
      {
          "name": "mixtral-8x7b-32768",
          "contextWindow": 32768
      },
      {
          "name": "gemma-7b-it",
          "contextWindow": 8192
      }
      */
    ];
  }
    
  /**
   * @description Initializes prototype slots
   * @category Initialization
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the service
   * @category Initialization
   */
  init () {
    super.init();
  }

  /**
   * @description Performs final initialization steps
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setTitle("Groq");
    this.setSystemRoleName("user"); // only replaced in outbound request json
  }

  /**
   * @description Checks if the API key is present and valid
   * @returns {boolean} True if the API key is present and valid, false otherwise
   * @category Authentication
   */
  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  /**
   * @description Validates the API key
   * @param {string} s - The API key to validate
   * @returns {boolean} True if the API key is valid, false otherwise
   * @category Authentication
   */
  validateKey (s) {
    return s.startsWith("gsk_");
  }

}.initThisClass());