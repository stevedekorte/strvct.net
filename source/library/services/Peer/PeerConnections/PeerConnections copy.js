"use strict";

/* 

    PeerConnections

*/

(class PeerConnections extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("Peer Connections");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([PeerConnection]);
    this.removeNodeAction("add");
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setTitle("Peer Connections");
    this.setNoteIsSubnodeCount(true);
  }

  service () {
    return this.parentNode()
  }

}.initThisClass());
