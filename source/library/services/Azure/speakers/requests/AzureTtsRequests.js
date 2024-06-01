"use strict";

/* 
    AzureTtsRequests

*/

(class AzureTtsRequests extends BMSummaryNode {
  initPrototypeSlots () {

  }

  init() {
    super.init();
    this.setTitle("requests");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([AzureTtsRequest]);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
    this.setTitle("requests");
  }

  /*
  didInit () {
    super.didInit()
  }
  */

  speaker () {
    return this.parentNode()
  }

}.initThisClass());
