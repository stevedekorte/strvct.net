"use strict";

/* 
    GroqService

    GroqService is a BMSummaryNode that holds the API key and subnodes for the various Groq services.

    Example:

    GroqService.shared().setApiKey("sk-1234567890");
    const hasApiKey = GroqService.shared().hasApiKey();


    Models:

        Context Window: 4,096 tokens
        API String: llama2-70b-4096

        Context Window: 32,768 tokens
        API String: mixtral-8x7b-32768

        Context Window: 8,192 tokens
        API String: gemma-7b-it


*/

(class GroqService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
    return this;
  }
  
  initPrototypeSlots () {
    
    /*
    {
      const slot = this.overrideSlot("models");
      //slot.setFinalInitProto(GroqModels);
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
    this.setTitle("Groq");

    this.setChatEndpoint("https://api.groq.com/openai/v1/chat/completions");

    // bad 
    // - insists on summarizing the prompt
    // - makes decisions for players
    // - aks for rolls on cantrips
    this.chatModel().setModelName("mixtral-8x7b-32768");
    this.chatModel().setMaxTokenCount(32768); 

    /*
    // unusable 
    // - understands it's a DM but can't even find character sheets 
    // - maybe content window is too small?
    this.chatModel().setModelName("llama2-70b-4096");
    this.chatModel().setMaxTokenCount(4096); 

    // utterly unusable 
    // - just summarized prompt and then couldn't discuss it
    this.chatModel().setModelName("gemma-7b-it");
    this.chatModel().setMaxTokenCount(8192); 
    */

    this.setSystemRoleName("user"); // only replaced in outbound request json
  }

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  chatRequestClass () {
    return GroqRequest;
  }

  validateKey (s) {
    return s.startsWith("gsk_");
  }

}.initThisClass());
