"use strict";

/* 
    AiChatModels

*/

(class AiChatModels extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("Chat Models");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit();
    this.setNoteIsSubnodeCount(true);
    this.setSubnodeClasses([AiChatModel]);
  }

  subviewsScrollSticksToBottom () {
    return false;
  }

  service () {
    return this.parentNode();
  }

}.initThisClass());
