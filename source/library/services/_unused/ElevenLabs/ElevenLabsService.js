"use strict";

/* 

    ElevenLabsService

*/

(class ElevenLabsService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
  }

  serviceInfo () {
    return {
      "source": "https://elevenlabs.io/docs/api-reference/sound-generation",
      "chatEndpoint": "https://api.elevenlabs.io/v1/sound-generation"
    };
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
