"use strict";

/* 
    GroqService

    Holds API key and subnodes for the various Groq services.

*/

(class GroqService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
  }

  modelsJson () {
    return [
      {
        "name": "llama-3.1-405b-reasoning",
        "contextWindow": 131072 
      },
      {
          "name": "llama-3.1-70b-versatile",
          "contextWindow": 131072
      },
      {
          "name": "llama-3.1-8b-instant",
          "contextWindow": 131072
      },
      {
          "name": "mixtral-8x7b-32768",
          "contextWindow": 32768
      },
      {
          "name": "gemma-7b-it",
          "contextWindow": 8192
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
    this.setTitle("Groq");

    this.setSystemRoleName("user"); // only replaced in outbound request json
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  validateKey (s) {
    return s.startsWith("gsk_");
  }

}.initThisClass());
