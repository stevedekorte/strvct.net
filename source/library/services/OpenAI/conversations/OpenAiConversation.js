"use strict";

/* 
    OpenAiConversation

*/

(class OpenAiConversation extends AiConversation {
  
  initPrototypeSlots() {

  }

  init() {
    super.init();
  }

  finalInit () {
    super.finalInit();
    this.setMaxTokenCount(8000);
    this.setTokenBuffer(400);
    this.setInitialMessagesCount(3);
    this.setSubnodeClasses([OpenAiMessage]);
    this.setResponseMsgClass(OpenAiResponseMessage);
  }

  service () {
    return OpenAiService.shared();
  }

}.initThisClass());
