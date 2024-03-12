"use strict";

/* 
    AnthropicConversation

*/

(class AnthropicConversation extends AiConversation {
  
  initPrototypeSlots() {
  }

  finalInit () {
    super.finalInit();
    this.setMaxTokenCount(200000); // base level 
    this.setTokenBuffer(400);
    this.setInitialMessagesCount(3);
    this.setSubnodeClasses([AnthropicMessage]);
    this.setResponseMsgClass(AnthropicResponseMessage);
  }

  service () {
    return AnthropicService.shared();
  }

}.initThisClass());
