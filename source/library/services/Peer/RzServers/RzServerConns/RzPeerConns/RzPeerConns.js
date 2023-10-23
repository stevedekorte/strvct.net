"use strict";

/* 

    RzPeerConns

*/

(class RzPeerConns extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("peer connections");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([RzPeerConn]);
    this.setCanAdd(false);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
  }

  serverConn () {
    return this.parentNode()
  }

  addIfAbsentPeerConnForId (id) {
    const match = this.subnodes().detect(sn => sn.peerId() === id)
    if (match) {
      return match
    }

    const pc = RzPeerConn.clone().setPeerId(id).setServerConn(this.serverConn())
    this.addSubnode(pc)
    return pc
  }

}.initThisClass());
