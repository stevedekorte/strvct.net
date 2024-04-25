"use strict";

/* 
    GroqService

    GroqService is a BMSummaryNode that holds the API key and subnodes for the various Groq services.

    Example:

    GroqService.shared().setApiKey("sk-1234567890");
    const hasApiKey = GroqService.shared().hasApiKey();


    Models:

        Model ID: llama3-70b-8192
        Context Window: 8,192 tokens

        Model ID:: llama2-70b-4096
        Context Window: 4,096 tokens

        Model ID:: mixtral-8x7b-32768
        Context Window: 32,768 tokens

        Model ID:: gemma-7b-it
        Context Window: 8,192 tokens

*/

(class GroqService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
    return this;
  }
  
  initPrototypeSlots () {
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Groq");

    this.setChatEndpoint("https://api.groq.com/openai/v1/chat/completions");

    //this.setupForMixtralModel();
    this.setupForLlamaModel();
    //this.setupForGemma();

    this.setSystemRoleName("user"); // only replaced in outbound request json
  }

  setupForMixtralModel () {
    // bad 
    // - insists on summarizing the prompt
    // - makes decisions for players
    // - aks for rolls on cantrips
    this.chatModel().setModelName("mixtral-8x7b-32768");
    this.chatModel().setMaxContextTokenCount(32768); 
  }

  setupForLlamaModel () {

    this.chatModel().setModelName("llama3-70b-8192");
    this.chatModel().setMaxContextTokenCount(8192)

    // unusable 
    // - understands it's a DM but can't even find character sheets 
    // - maybe content window is too small?
    //this.chatModel().setModelName("llama2-70b-4096");
    //this.chatModel().setMaxContextTokenCount(4096); 
  }

  setupForGemma () {
    // utterly unusable 
    // - just summarized prompt and then couldn't discuss it
    this.chatModel().setModelName("gemma-7b-it");
    this.chatModel().setMaxContextTokenCount(8192); 
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
