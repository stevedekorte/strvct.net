"use strict";

/* 
    OpenAiResponseMessage

*/

(class OpenAiResponseMessage extends AiResponseMessage {
  initPrototypeSlots() {

  }

  init () {
    super.init();
    this.setRequestClass(OpenAiRequest); // subclasses should set this
  }

}.initThisClass());
