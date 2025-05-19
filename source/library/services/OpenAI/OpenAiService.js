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

  serviceInfo () {
    return {
      "chatEndpoint": "https://api.openai.com/v1/chat/completions"
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
        "name": "gpt-4.1",
        "title": "ChatGPT 4.1",
        "inputTokenLimit": 1047576,
        "outputTokenLimit": 32768
      },
      {
        "name": "gpt-4.1-mini",
        "title": "ChatGPT 4.1 mini",
        "inputTokenLimit": 1047576,
        "outputTokenLimit": 32768
      },
      /*
      {
        "name": "gpt-4.1-nano",
        "title": "OpenAI ChatGPT 4.1 nano",
        "inputTokenLimit": 1047576,
        "outputTokenLimit": 32768
      },
      */
     /*
      {
        "name": "o3-2025-04-16",
        "title": "OpenAI ChatGPT o3",
        "inputTokenLimit": 200000,
        "outputTokenLimit": 100000,
        "supportsTemperature": false,
        "supportsTopP": false
      },
      {
        "name": "o3-mini-2025-01-31",
        "title": "OpenAI ChatGPT o3 mini",
        "inputTokenLimit": 128000,
        "outputTokenLimit": 16384,
        "supportsTemperature": false,
        "supportsTopP": false
      }
      */


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

   // this.setupModelsFromFetch();
  }

  async setupModelsFromFetch () {
    try {
      const modelsJson = await this.fetchAllModelsDetails();
      console.log(modelsJson);
      debugger;
    } catch (error) {
      console.error("Error fetching models:", error);
    }
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
   * @description Fetches the models URL.
   * @returns {string} The URL for fetching models.
   * @category Models
   */
  fetchModelsUrl () {
    return "https://api.openai.com/v1/models";
  }

  fetchModelDetailsUrl (modelId) {
    return `https://api.openai.com/v1/models/${modelId}`;
  }

  /**
   * @description Fetches the model details.
   * @param {string} apiKey - The API key to use.
   * @returns {Promise<Object>} A promise that resolves to the model details.
   * @category Models
   */
  async fetchAllModelsDetails () {
    const apiKey = this.apiKeyOrUserAuthToken();
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };
  
    // Step 1: Fetch the list of model IDs
    const listResp = await fetch(this.fetchModelsUrl(), { headers: headers });
    debugger;
    if (!listResp.ok) throw new Error(`Model list fetch failed: ${listResp.statusText}`);
    const listData = await listResp.json();
  
    // Step 2: Fetch extended info on each model
    const detailedModels = {};
    for (const model of listData.data) {
      const id = model.id;
      try {
        const detailResp = await fetch(this.fetchModelDetailsUrl(id), { headers: headers });
        if (!detailResp.ok) throw new Error(`Fetch failed for ${id}: ${detailResp.statusText}`);
        const detailData = await detailResp.json();
        detailedModels[id] = detailData;
      } catch (err) {
        console.warn(`Skipping model ${id} due to error:`, err.message);
      }
    }
  
    return detailedModels;
  }
  

}.initThisClass());