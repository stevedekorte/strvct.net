"use strict";

/* 

    RzSigServerPeers

*/

(class RzSigServerPeers extends BMSummaryNode {
  
  initPrototypeSlots () {
    this.setTitle("peers");
    this.setShouldStore(false);
    this.setShouldStoreSubnodes(false);
    //this.setSubnodeClasses([RzSigServer]);
    this.setNodeCanAddSubnode(false);
    this.setNodeCanReorderSubnodes(false);
    this.setNoteIsSubnodeCount(true);
  }


  setPeerIdArray (peerIds) {
    /*
    const idSet = peerIds.asSet()
    const subnodesToRemove = this.subnodes().shallowCopy().filter(sn => !idSet.has(sn.peerId()))
    this.removeSubnodes(subnodesToRemove)
    */

    // TODO: switch to merge
    this.removeAllSubnodes()
    peerIds.sort()
    peerIds.forEach(peerId => {
      const rzPeer = RzPeer.clone().setPeerId(peerId)
      this.addSubnode(rzPeer)
    })
    return this
  }

}.initThisClass());
