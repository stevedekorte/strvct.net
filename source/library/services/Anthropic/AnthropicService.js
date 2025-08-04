"use strict";

/**
 * @module library.services.Anthropic
 */

/**
 * @class AnthropicService
 * @extends AiService
 * @classdesc A SvSummaryNode that holds the API key and subnodes for the various Anthropic services.
 * 
 * @example
 * AnthropicService.shared().setApiKey("...");
 * const hasApiKey = AnthropicService.shared().hasApiKey();
*/

(class AnthropicService extends AiService {

  /**
   * @static
   * @description Initializes the class as a singleton.
   * @category Initialization
   */
  static initClass () {
    this.setIsSingleton(true);
  }

  /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model configuration objects.
   * @category Configuration
   */
  modelsJson () {
    return [

      {
        "name": "claude-sonnet-4-20250514",
        "title": "Claude 4 Sonnet",
        "subtitle": "",
        "inputTokenLimit": 200000,
        "notes": "",
        "beta": "output-128k-2025-02-19",
        "outputTokenLimit": 64000,
      },

      {
        "name": "claude-opus-4-20250514",
        "title": "Claude 4 Opus",
        "subtitle": "",
        "inputTokenLimit": 200000,
        "notes": "",
        "beta": "output-128k-2025-02-19",
        "outputTokenLimit": 32000,
      },

      {
        "name": "claude-3-7-sonnet-20250219",
        "title": "Claude 3.7 Sonnet",
        "subtitle": "",
        "inputTokenLimit": 200000,
        "notes": "",
        "beta": "output-128k-2025-02-19",
        "outputTokenLimit": 128000,
        "extraHeaders": {
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "output-128k-2025-02-19",
          'anthropic-dangerous-direct-browser-access': true
        }
      }
      /*
      {
        "name": "claude-3-5-sonnet-20241022",
        "title": "Claude 3.5 Sonnet",
        "subtitle": "",
        "inputTokenLimit": 200000,
        "notes": "",
        "outputTokenLimit": 8192,
        "extraHeaders": {
          "anthropic-version": "2023-06-01",
          'anthropic-dangerous-direct-browser-access': true
        }
      },
      {
        "name": "claude-3-5-sonnet-20240620",
        "title": "Claude 3.5 Sonnet",
        "subtitle": "Better than 3 with same context size.",
        "inputTokenLimit": 200000,
        "notes": ""
      },
      {
          "name": "claude-3-opus-20240229",
          "title": "Claude 3 Opus",
          "subtitle": "Largest/Slowest",
          "inputTokenLimit": 200000,
          "notes": ""
      },
      {
          "name": "claude-3-sonnet-20240229",
          "title": "Claude 3 Sonnet",
          "subtitle": "Medium size and speed",
          "inputTokenLimit": 200000,
          "notes": "This model is missing opening description, doesn't make roll request json with required fields"
      },
      {
          "name": "claude-3-haiku-20240307",
          "title": "Claude 3 Haiku",
          "subtitle": "Smallest/Fastest",
          "inputTokenLimit": 200000,
          "notes": "This model also doesn't make roll request json with required fields"
      }
      */
    ];
  }
  
  /**
   * @description Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the service.
   * @category Initialization
   */
  init () {
    super.init();
  }

  serviceInfo () {
    return {
      "chatEndpoint": "https://api.anthropic.com/v1/messages"
    };
  }

  /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setTitle(this.type().before("Service"));
    //this.setSystemRoleName("user"); // only replaced in outbound request json // we now move this message into the system property
  }

  /*
  setHasDoneInit (aBool) {
    debugger;
    return super.setHasDoneInit(aBool);
  }
  */

  /**
   * @description Validates the API key format.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the API key is valid, false otherwise.
   * @category Authentication
   */
  validateKey (s) {
    return s.startsWith("sk-");
  }

  /**
   * @description Checks if a valid API key is set.
   * @returns {boolean} True if a valid API key is set, false otherwise.
   * @category Authentication
   */
  hasApiKey () {
    return this.apiKeyOrUserAuthToken() && this.apiKeyOrUserAuthToken().length > 0;
  }

  /**
   * @description Prepares the request before sending it to the API.
   * @param {Object} aRequest - The request object to prepare.
   * @returns {AnthropicService} The service instance.
   * @category Request Handling
   */
  prepareToSendRequest (aRequest) {
    const bodyJson = aRequest.bodyJson();
    let messages = bodyJson.messages;

    // remove initial system message and place it in the request json

    if (messages.length > 0) {
      const firstMessage = messages.first();
      if (firstMessage.role === this.systemRoleName()) {
        bodyJson.system = firstMessage.content;
        firstMessage.content = "Please begin the conversation now.";
        //messages.shift();
      }
    }

    bodyJson.reorderKeyFirst("system");

    // remove messages with empy content
    messages = messages.filter((message) => { return message.content.length > 0; });

    // merge messages in order to ensure messages alternate between user and assistant roles

    const newMessages = [];
    let lastRole = null;
    let mergedMessageCount = 0;
    messages.forEach((message) => {
      if (message.role === "system") {
        message.role = this.userRoleName(); //  need to do this now that we're using the system property
      }
      if (message.role === lastRole) {
        const lastMessage = newMessages.last();
        //lastMessage.content += "\n- - - <comment>merged message content</comment> - - -\n" 
        lastMessage.content = lastMessage.content + "\n" + message.content;
      } else {
        newMessages.push(message);
      }
      lastRole = message.role;
      mergedMessageCount += 1;
    });

    this.reorderKeyFirst("system");

    bodyJson.messages = newMessages;
    aRequest.setBodyJson(bodyJson);

    if (mergedMessageCount) {
      //console.log("AnthropicService.prepareToSendRequest() merged " + mergedMessageCount + " messages");
    }
    return this;
  }

  /**
 * @description Returns the URL for fetching models. 
 * @returns {string} The URL for fetching models.
 * @category Models
 */
  fetchModelsUrl () {
    return "https://api.anthropic.com/v1/models";
  }


}.initThisClass());