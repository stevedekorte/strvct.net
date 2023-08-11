"use strict";

/*

    HwAiChatMessage

*/

(class HwAiChatMessage extends BMSummaryNode {

  initPrototypeSlots () {

  }

  init () {
    super.init();

    this.removeAction("add");
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("");
    this.setSubtitle("message");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  finalInit () {
    super.finalInit();
  }

  send () {

  }

}).initThisClass();
