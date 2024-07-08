"use strict";

/* 

    ElevenLabsService

*/

(class ElevenLabsService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
  }

  modelsJson () {
    return [
    ];
  }
  
  initPrototypeSlots () {
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("ElevenLabs");
  }

  validateKey (s) {
    return true;
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  prepareToSendRequest (aRequest) {
    return this;
  }

}.initThisClass());
