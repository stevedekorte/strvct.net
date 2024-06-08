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
  }

  modelsJson () {
    return [
      {
          "name": "gpt-4o",
          "note": "Cheaper and faster than GPT-4 Turbo.",
          "contextWindow": 128000
      },
      {
          "name": "gpt-4-1106-preview",
          "note": "better instruction following",
          "contextWindow": 128000
      },
      {
          "name": "gpt-4-turbo",
          "contextWindow": 128000
      },
      {
          "name": "gpt-4-turbo-2024-04-09",
          "contextWindow": 128000
      }
    ];
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

    // model and other info is set via OpenAiService.json file
    // see: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
  }

  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

}.initThisClass());
