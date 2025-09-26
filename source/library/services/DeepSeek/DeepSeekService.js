/**
 * @module library.services.DeepSeek
 */

/**
 * @class DeepSeekService
 * @extends AiService
 * @classdesc DeepSeekService is a SvSummaryNode that holds the API key and subnodes for the various OpenAI services.
 * 
 * Example:
 * 
 * DeepSeekService.shared().setApiKey("sk-1234567890");
 * const hasApiKey = DeepSeekService.shared().hasApiKey();
 */
"use strict";

(class DeepSeekService extends AiService {

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
        "name": "deepseek-coder",
        "title": "DeepSeek Coder",
        "inputTokenLimit": 65536,
        "outputTokenLimit": 8192,
        "maxChainOfThoughtTokens": 32000
      }
      /*
      {
          "name": "deepseek-chat",
          "title": "DeepSeek Chat",
          "inputTokenLimit": 65536,
          "outputTokenLimit": 8192,
          "maxChainOfThoughtTokens": 8000
      },

      {
          "name": "deepseek-reasoner",
          "title": "DeepSeek Reasoner",
          "inputTokenLimit": 64000,
          "outputTokenLimit": 32000,
          "maxChainOfThoughtTokens": 32000
      }
      */
    ];
  }
  
  /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
  initPrototypeSlots () {

  }

  /**
   * @description Initializes the instance.
   * @category Initialization
   */
  init () {
    super.init();
  }

  /**
   * @description Returns the service information.
   * @returns {Object} The service information.
   * @category Service Information
   */
  serviceInfo () {
    return {
      "source": "https://api-docs.deepseek.com",
      "chatEndpoint": "https://api.deepseek.com/chat/completions"
    };
  }

  /**
   * @description Performs final initialization steps for the instance.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setTitle(this.svType().before("Service"));
    this.assertHasModels();
    

    // model and other info is set via DeepSeekService.json file
    // see: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
  }

  /**
   * @description Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the key is valid, false otherwise.
   * @category Authentication
   */
  validateKey (/*s*/) {
    return true;
  }


  setModelsJson (json) {
    super.setModelsJson(json);
    //console.log(this.svType() + ".setModelsJson() has " + this.models().subnodes().length + " models now."); 
    this.assertHasModels();
    
    return this;
  }

  setModels (aAiChatModels) {
    
    return super.setModels(aAiChatModels);
  }

  /*
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
      //console.log(this.svType() +".prepareToSendRequest() merged " + mergedMessageCount + " messages");
    }
    return this;
  }
*/

 assertHasModels ()  {
  assert(this.models().subnodes().length > 0, "DeepSeekService must have at least one model");
 }

 /*
 title () {
  this.assertHasModels();
  return super.title() + " (" + this.models().subnodes().length + " models)";
 }
*/

}.initThisClass());