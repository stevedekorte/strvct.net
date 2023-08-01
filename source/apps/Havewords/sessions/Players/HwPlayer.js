"use strict";

/*

    HwPlayer

*/

(class HwPlayer extends BMSummaryNode {

  initPrototypeSlots () {
    // id, nickname, avatar, playerSheet

  }

  init () {
    super.init();

    this.addAction("add");
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled");
    this.setSubtitle("player");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  finalInit () {
    super.finalInit();
  }

}).initThisClass();
