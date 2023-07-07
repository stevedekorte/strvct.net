"use strict";

/* 
    AzureSpeakers


*/

(class AzureSpeakers extends BMSummaryNode {
  initPrototypeSlots() {
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(true)
  }

  init () {
    super.init();
    this.addAction("add")
    return this;
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Speakers")
    this.setSubnodeClasses([AzureSpeaker])
    this.setNodeCanReorderSubnodes(true)
    this.setNoteIsSubnodeCount(true);
    //this.subnodes().forEach(sn => sn.setService(this.service()))
  }

  service () {
    return this.parentNode()
  }


}.initThisClass());

