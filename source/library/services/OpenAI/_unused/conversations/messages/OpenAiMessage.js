"use strict";

/* 
    OpenAiMessage

*/

(class OpenAiMessage extends AiMessage {
  initPrototypeSlots() {
  }

  init () {
    super.init();
    this.setRole(this.userRoleName());
  }

}.initThisClass());
