"use strict";

/*

    HwAiChatMessage

*/

(class HwAiChatMessage extends OpenAiMessage {

  initPrototypeSlots () {

  }

  init () {
    super.init();

  }

  finalInit () {
    super.finalInit();

  }

  isVisible () {
    return this.role() !== "system"
  }

  /*
  onValueInput () {
    this.send()
    return this;
  }

  send () {

  }
  */

}).initThisClass();
