"use strict";

/* 
    AzureSpeakers


*/

(class AzureSpeakers extends BMSummaryNode {
  initPrototypeSlots () {
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(true)
  }

  init () {
    super.init();
    this.setNodeCanAddSubnode(true)
    return this;
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Speakers")
    this.setSubnodeClasses([AzureSpeaker])
    this.setNodeCanReorderSubnodes(true)
    this.setNoteIsSubnodeCount(true);
  }

  service () {
    return this.parentNode()
  }

}.initThisClass());

