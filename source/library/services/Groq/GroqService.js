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

  serviceInfo () {
    return {
      "chatEndpoint": "https://api.groq.com/openai/v1/chat/completions"
    };
  }

  /**
   * @description Returns the JSON representation of available models
   * @returns {Array} An array of model objects
   * @category Model Management
   */
  modelsJson () {
    // See: https://console.groq.com/docs/models
    return [
      {
        "name": "deepseek-r1-distill-llama-70b",
        "title": "DeepSeek R1 Distill Llama 70B",
        "inputTokenLimit": 128000,
        "outputTokenLimit": 128000 // just a guess, not specified
      },
      /*
      {
        "name": "llama-3.1-405b-reasoning",
        "title": "Groq Llama 3.1 405B Reasoning",
        "inputTokenLimit": 131072 
      }
      {
          "name": "llama-3.1-70b-versatile",
          "title": "Groq Llama 3.1 70B Versatile",
          "inputTokenLimit": 131072
      },
      {
          "name": "llama-3.1-8b-instant",
          "title": "Groq Llama 3.1 8B Instant",
          "inputTokenLimit": 131072
      },
      {
          "name": "mixtral-8x7b-32768",
          "title": "Groq Mixtral 8x7B",
          "inputTokenLimit": 32768
      },
      {
          "name": "gemma-7b-it",
          "title": "Groq Gemma 7B IT",
          "inputTokenLimit": 8192
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
    this.setTitle(this.type().before("Service"));
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

  prepareToSendRequest (aRequest) {
    const bodyJson = aRequest.bodyJson();
    let messages = bodyJson.messages;

    // remove initial system message and place it in the request json
    debugger;
    if (messages.length == 1 && messages[0].role === this.systemRoleName()) {
      // if the last message is not a user message, we need to add a user message
      const userMessage = {
        role: this.userRoleName(),
        content: "Please begin the conversation now."
      }
      messages.push(userMessage);
    }

    // remove messages with empy content
    messages = messages.filter((message) => { return message.content.length > 0; });

    // merge messages in order to ensure messages alternate between user and assistant roles
    /*
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
   */
    bodyJson.messages = messages; // newMessages not needed
    aRequest.setBodyJson(bodyJson);

    /*
    if (mergedMessageCount) {
      //console.log("AnthropicService.prepareToSendRequest() merged " + mergedMessageCount + " messages");
    }
    */
    return this;
  }

}.initThisClass());