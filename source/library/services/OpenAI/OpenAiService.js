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

    this.setChatEndpoint("https://api.openai.com/v1/chat/completions");
    // see: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
    this.chatModel().setModelName("gpt-4-1106-preview"); // GPT-4-1106-preview (better instruction following)
    this.chatModel().setMaxContextTokenCount(128000);
  }

  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  chatRequestClass () {
    return OpenAiRequest;
  }

}.initThisClass());
