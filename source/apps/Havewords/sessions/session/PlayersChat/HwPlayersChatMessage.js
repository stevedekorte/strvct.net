"use strict";

/*

    HwPlayersChatMessage

*/

(class HwPlayersChatMessage extends BMSummaryNode {

  initPrototypeSlots () {

  }

  init () {
    super.init();

    this.addNodeAction("add");
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled");
    this.setSubtitle("message");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  finalInit () {
    super.finalInit();
  }

  send () {

  }

}).initThisClass();
