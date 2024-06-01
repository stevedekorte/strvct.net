"use strict";

/* 
    AnthropicService

    AnthropicService is a BMSummaryNode that holds the API key and subnodes for the various Anthropic services.

    Example:

      AnthropicService.shared().setApiKey("sk-1234567890");
      const hasApiKey = AnthropicService.shared().hasApiKey();


    MODEL NOTES:

      claude-3-sonnet-20240229 // missing opening description, doesn't make roll request json with required fields
      claude-3-haiku-20240307 // also doesn't make roll request json with required fields

*/

(class AnthropicService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
  }

  modelsJson () {
    return [
      {
          "name": "claude-3-opus-20240229",
          "title": "Claude 3 Opus",
          "subtitle": "Largest/Slowest",
          "contextWindow": 200000,
          "notes": "This is the best model I've found so far."
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
  
  initPrototypeSlots () {
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Anthropic");
    //this.setSystemRoleName("user"); // only replaced in outbound request json // we now move this message into the system property
  }

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  prepareToSendRequest (aRequest) {
    const bodyJson = aRequest.bodyJson();
    let messages = bodyJson.messages;

    // remove initial system message and place it in the request json

    if (messages.length > 0) {
      const firstMessage = messages.first();
      if (firstMessage.role === this.systemRoleName()) {
        bodyJson.system = firstMessage.content;
        firstMessage.content = "Please begin the game now. Remember to not make action decisions for the players, to use roll requests (instead up making up roll results), and to ask for initiative rolls before combat.";
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
