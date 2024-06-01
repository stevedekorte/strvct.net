"use strict";

/* 

    RzPeerConns

*/

(class RzPeerConns extends BMSummaryNode {
  initPrototypeSlots () {
    this.setSubnodeClasses([RzPeerConn]);
    this.setTitle("connections to peers");
    this.setShouldStore(false);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanAddSubnode(false);
    this.setNodeCanReorderSubnodes(true);
    this.setNoteIsSubnodeCount(true);
  }

  finalInit() {
    super.finalInit()
    assert(this.subnodeCount() === 0); // sanity check
  }

  sigServerConn () {
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

    const pc = this.peerConnClass().clone().setPeerId(id).setSigServerConn(this.sigServerConn())
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

  disconnectAllPeers () {
    this.subnodes().forEach(sn => sn.disconnect())
    return this
  }

}.initThisClass());
