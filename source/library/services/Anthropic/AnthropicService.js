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
      slot.setFinalInitProto(AnthropicConversations);
      slot.setIsSubnode(true);
    }

  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Anthropic");
    this.setSubtitle("AI services");

    // do we really want these to replace any stored values?
    this.setChatModel("claude-3-opus-20240229");
    this.setChatEndpoint("https://api.anthropic.com/v1/messages");
    this.setChatStreamEndpoint("https://api.anthropic.com/v1/messages");
  }

  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

}.initThisClass());
