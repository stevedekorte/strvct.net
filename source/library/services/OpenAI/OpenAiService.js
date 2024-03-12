"use strict";

/* 
    OpenAiService

    OpenAiService is a BMSummaryNode that holds the API key and subnodes for the various OpenAI services.

    Example:

    OpenAiService.shared().setApiKey("sk-1234567890");
    const hasApiKey = OpenAiService.shared().hasApiKey();

*/

(class OpenAiService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
    return this;
  }
  
  initPrototypeSlots () {
    
    /*
    {
      const slot = this.overrideSlot("models");
      slot.setFinalInitProto(OpenAiModels);
      slot.setIsSubnode(true);
    }
    */

    {
      const slot = this.overrideSlot("conversations", null);
      slot.setFinalInitProto(OpenAiConversations);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.overrideSlot("imagesPrompts", null);
      slot.setFinalInitProto(OpenAiImagePrompts);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.overrideSlot("ttsSessions", null);
      slot.setFinalInitProto(OpenAiTtsSessions);
      slot.setIsSubnode(true);
    }

  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("OpenAI");
    this.setSubtitle("AI services");

    // do we really want these to replace any stored values?
    this.setChatModel("gpt-4-turbo-preview");
    this.setChatEndpoint("https://api.openai.com/v1/chat/completions");
    this.setChatStreamEndpoint("https://api.openai.com/v1/chat/completions");
  }

  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

}.initThisClass());
