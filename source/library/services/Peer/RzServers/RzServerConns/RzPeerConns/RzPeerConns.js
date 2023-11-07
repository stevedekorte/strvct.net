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

  setPeerConClass (aClass) {
    // assert(aClass.isKindOf(RzPeerConn.thisClass()));
    this.setSubnodeClasses([aClass])
    return this
  }

  peerConnClass () {
    return this.subnodeClasses().first()
  }

  addIfAbsentPeerConnForId (id) {
    const match = this.subnodes().detect(sn => sn.peerId() === id)
    if (match) {
      return match
    }

    const pc = this.peerConnClass().clone().setPeerId(id).setServerConn(this.serverConn())
    this.addSubnode(pc)
    return pc
  }

}.initThisClass());
