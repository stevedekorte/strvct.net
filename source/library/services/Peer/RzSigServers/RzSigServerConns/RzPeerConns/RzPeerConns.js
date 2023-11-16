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
    this.setShouldStore(false);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([RzPeerConn]);
    this.setCanAdd(false);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
    assert(this.subnodeCount() === 0);
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
    this.assertValidSubnodes()

    const match = this.subnodes().detect(sn => sn.peerId() === id)
    if (match) {
      return match
    }

    const pc = this.peerConnClass().clone().setPeerId(id).setServerConn(this.serverConn())
    this.addSubnode(pc)
    return pc
  }

  assertValidSubnodes () {
    const invalidMatch = this.subnodes().detect(sn => sn.thisClass().type() !== this.peerConnClass().type())
    assert(!invalidMatch);
  }

  addSubnode (aSubnode) {
    this.assertValidSubnodes()
    const r = super.addSubnode(aSubnode)
    this.assertValidSubnodes()
    return r
  }

}.initThisClass());
