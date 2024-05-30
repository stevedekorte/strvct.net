"use strict";

/* 
    SttMessages

*/

(class SttMessages extends BMSummaryNode {
  initPrototypeSlots() {
    this.setSubnodeClasses([SttMessage]);
  }

  init() {
    super.init();
    this.setTitle("log");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
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
