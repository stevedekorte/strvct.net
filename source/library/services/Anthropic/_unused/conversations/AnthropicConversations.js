"use strict";

/* 
    AnthropicConversations

*/

(class AnthropicConversations extends AiConversations {
  initPrototypeSlots() {
  }

  finalInit () {
    super.finalInit();
    this.setSubnodeClasses([AnthropicConversation]); 
  }

}.initThisClass());
