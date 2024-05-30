"use strict";

/* 
    AiConversations

    conversations
    - conversation
    - - requests
    - - - request, response


*/

(class AiConversations extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("Conversations");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit();
    this.setNoteIsSubnodeCount(true);

    // subclasses should set this
    this.setSubnodeClasses([AiConversation]);
  }

  subviewsScrollSticksToBottom () {
    return false;
  }

  service () {
    return this.parentNode();
  }

}.initThisClass());
