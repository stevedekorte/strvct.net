"use strict";

/* 

    RzMsgs

*/

(class RzMsgs extends BMSummaryNode {
  
  initPrototypeSlots() {
    this.setSubnodeClasses([RzMsg]);
    this.setTitle("peer messages");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setNoteIsSubnodeCount(true);
  }

  peerConn () {
    return this.parentNode()
  }

}.initThisClass());
