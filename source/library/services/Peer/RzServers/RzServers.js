"use strict";

/* 
    RzServers

*/

(class RzServers extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("Servers");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([RzServer]);
    this.addNodeAction("add");
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setTitle("Rendezvous Servers");
    this.setNoteIsSubnodeCount(true);
  }

  /*
  didInit () {
    super.didInit()
  }
  */

  service () {
    return this.parentNode()
  }

}.initThisClass());
