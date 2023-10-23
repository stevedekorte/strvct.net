"use strict";

/* 

    RzServerConns

*/

(class RzServerConns extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("server connections");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([RzServerConn]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
  }

  service () {
    return this.parentNode()
  }

}.initThisClass());
