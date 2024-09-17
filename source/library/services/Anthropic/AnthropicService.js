"use strict";

/** 
 * @module AiServiceKit.Anthropic
 * @class AnthropicService
 * @extends AiService
 * @description A BMSummaryNode that holds the API key and subnodes for the various Anthropic services.
 * 
 * @example
 * AnthropicService.shared().setApiKey("sk-1234567890");
 * const hasApiKey = AnthropicService.shared().hasApiKey();
*/

(class AnthropicService extends AiService {

  /**
   * Initializes the class as a singleton.
   */
  static initClass () {
    this.setIsSingleton(true);
  }

  /**
   * Returns an array of model configurations.
   * @returns {Array<Object>} An array of model configuration objects.
   */
  modelsJson () {
    return [
      {
        "name": "claude-3-5-sonnet-20240620",
        "title": "Claude 3.5 Sonnet",
        "subtitle": "Better than 3 with same context size.",
        "contextWindow": 200000,
        "notes": ""
      },
      {
          "name": "claude-3-opus-20240229",
          "title": "Claude 3 Opus",
          "subtitle": "Largest/Slowest",
          "contextWindow": 200000,
          "notes": ""
      },
      {
          "name": "claude-3-sonnet-20240229",
          "title": "Claude 3 Sonnet",
          "subtitle": "Medium size and speed",
          "contextWindow": 200000,
          "notes": "This model is missing opening description, doesn't make roll request json with required fields"
      },
      {
          "name": "claude-3-haiku-20240307",
          "title": "Claude 3 Haiku",
          "subtitle": "Smallest/Fastest",
          "contextWindow": 200000,
          "notes": "This model also doesn't make roll request json with required fields"
      }
    ];
  }
  
  /**
   * Initializes the prototype slots.
   */

  initPrototypeSlots () {
  }

  /**
   * Initializes the service.
   */
  init () {
    super.init();
  }

  /**
   * Performs final initialization steps.
   */
  finalInit () {
    super.finalInit()
    this.setTitle("Anthropic");
    //this.setSystemRoleName("user"); // only replaced in outbound request json // we now move this message into the system property
  }

  /**
   * Validates the API key format.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the API key is valid, false otherwise.
   */
  validateKey (s) {
    return s.startsWith("sk-");
  }

  /**
   * Checks if a valid API key is set.
   * @returns {boolean} True if a valid API key is set, false otherwise.
   */
  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  /**
   * Prepares the request before sending it to the API.
   * @param {Object} aRequest - The request object to prepare.
   * @returns {AnthropicService} The service instance.
   */
  prepareToSendRequest (aRequest) {
    const bodyJson = aRequest.bodyJson();
    let messages = bodyJson.messages;

    // remove initial system message and place it in the request json

    if (messages.length > 0) {
      const firstMessage = messages.first();
      if (firstMessage.role === this.systemRoleName()) {
        bodyJson.system = firstMessage.content;
        //firstMessage.content = "Please begin the game now. Remember to not make action decisions for the players, to use roll requests (instead of making up roll results), and to ask for initiative rolls before combat.";
        firstMessage.content = "Please begin our session now.";
        //messages.shift();
      }
    }

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

    bodyJson.messages = newMessages;
    aRequest.setBodyJson(bodyJson);

    if (mergedMessageCount) {
      //console.log("AnthropicService.prepareToSendRequest() merged " + mergedMessageCount + " messages");
    }
    return this;
  }

}.initThisClass());
