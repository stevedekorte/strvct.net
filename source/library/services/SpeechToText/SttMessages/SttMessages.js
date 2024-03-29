"use strict";

/* 
    SttMessages

*/

(class SttMessages extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("log");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([SttMessage]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
  }

  /*
  service () {
    return this.parentNode()
  }
  */

}.initThisClass());
