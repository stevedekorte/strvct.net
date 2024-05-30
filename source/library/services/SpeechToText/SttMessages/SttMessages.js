"use strict";

/* 
    SttMessages

*/

(class SttMessages extends BMSummaryNode {
  initPrototypeSlots() {
    this.setSubnodeClasses([SttMessage]);
    this.setTitle("log");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setNoteIsSubnodeCount(true);
  }

  /*
  service () {
    return this.parentNode()
  }
  */

}.initThisClass());
