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

    this.setSystemRoleName("user"); // only replaced in outbound request json
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
    // may need to merge messages in order to ensure messages alternate between user and assistant roles
    const bodyJson = aRequest.bodyJson();
    const messages = bodyJson.messages;
    const newMessages = [];
    let lastRole = null;
    let mergedMessageCount = 0;
    messages.forEach((message) => {
      if (message.role === lastRole) {
        const lastMessage = newMessages.last();
        lastMessage.content += "\n---\n" + message.content;
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
