"use strict";

/* 
    AnthropicService

    AnthropicService is a BMSummaryNode that holds the API key and subnodes for the various Anthropic services.

    Example:

    AnthropicService.shared().setApiKey("sk-1234567890");
    const hasApiKey = AnthropicService.shared().hasApiKey();


*/

(class AnthropicService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
    return this;
  }
  
  initPrototypeSlots () {
    
    /*
    {
      const slot = this.overrideSlot("models");
      //slot.setFinalInitProto(AnthropicModels);
      slot.setIsSubnode(true);
    }
    */

    {
      const slot = this.overrideSlot("conversations", null);
      slot.setFinalInitProto(AiConversations);
      slot.setIsSubnode(true);
    }

  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Anthropic");

    this.setChatEndpoint("https://api.anthropic.com/v1/messages");
    this.chatModel().setModelName("claude-3-opus-20240229");
    this.chatModel().setMaxContextTokenCount(200000); // base level 

    //this.setSystemRoleName("user"); // only replaced in outbound request json // we now move this message into the system property
  }

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  chatRequestClass () {
    return AnthropicRequest;
  }

  prepareToSendRequest (aRequest) {
    const bodyJson = aRequest.bodyJson();
    const messages = bodyJson.messages;

    // remove initial system message and place it in the request json

    if (messages.length > 0) {
      const firstMessage = messages.first();
      if (firstMessage.role === this.systemRoleName()) {
        bodyJson.system = firstMessage.content;
        firstMessage.content = "Please begin the game now.";
        //messages.shift();
      }
    }

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
        lastMessage.content += "\n- - - <comment>merged message content</comment> - - -\n" + message.content;
      } else {
        newMessages.push(message);
      }
      lastRole = message.role;
      mergedMessageCount += 1;
    });

    bodyJson.messages = newMessages;
    aRequest.setBodyJson(bodyJson);

    if (mergedMessageCount) {
      console.log("AnthropicService.prepareToSendRequest() merged " + mergedMessageCount + " messages");
    }
    return this;
  }

}.initThisClass());
