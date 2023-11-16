"use strict";

/* 

    RzSigServerConns

*/

(class RzSigServerConns extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("server connections");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([RzSigServerConn]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
  }

  service () {
    return this.parentNode()
  }

  connClass () {
    return this.subnodeClasses().first()
  }

  /*
  addWithPeerId (requestedPeerId) {
    const conn = this.connClass().clone()
    conn.setPeerId(requestedPeerId)
    this.addSubnode(conn)
    return conn
  }
  */

}.initThisClass());
