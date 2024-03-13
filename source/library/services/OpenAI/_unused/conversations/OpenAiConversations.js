"use strict";

/* 
    OpenAiConversations

    conversations
    - conversation
    - - requests
    - - - request, response


*/

(class OpenAiConversations extends AiConversations {
  initPrototypeSlots() {
  }

  init() {
    super.init();
  }


  finalInit () {
    super.finalInit()
    this.setSubnodeClasses([OpenAiConversation]);
  }


}.initThisClass());
