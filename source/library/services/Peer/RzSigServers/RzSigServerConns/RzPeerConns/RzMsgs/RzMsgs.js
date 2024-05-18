"use strict";

/* 

    RzMsgs

*/

(class RzMsgs extends BMSummaryNode {
  initPrototypeSlots() {

    this.setSubnodeClasses([RzMsg]);
  }

  init() {
    super.init();
    this.setTitle("peer messages");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setCanAdd(true);
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
