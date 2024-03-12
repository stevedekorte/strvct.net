"use strict";

/* 
    AnthropicResponseMessage

*/

(class AnthropicResponseMessage extends AiResponseMessage {
  initPrototypeSlots() {

  }

  init () {
    super.init();
  }


  finalInit () {
    super.finalInit();
    this.setRequestClass(AnthropicRequest); // subclasses should set this
  }

}.initThisClass());
