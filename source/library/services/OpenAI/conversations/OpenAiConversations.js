"use strict";

/* 
    OpenAiConversations

    conversations
    - conversation
    - - requests
    - - - request, response


*/

(class OpenAiConversations extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("Conversations");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiConversation]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
  }

  /*
  didInit () {
    super.didInit()
  }
  */

  service () {
    return this.parentNode()
  }

}.initThisClass());
