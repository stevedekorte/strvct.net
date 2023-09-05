"use strict";

/* 

    RzMsgs

*/

(class RzMsgs extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("peer messages");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([RzMsg]);
    this.addNodeAction("add");
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
  }

  peerConn () {
    return this.parentNode()
  }

}.initThisClass());
