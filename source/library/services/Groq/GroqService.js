"use strict";

/* 
    GroqService

    Holds API key and subnodes for the various Groq services.

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

    this.setSystemRoleName("user"); // only replaced in outbound request json
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  validateKey (s) {
    return s.startsWith("gsk_");
  }

}.initThisClass());
