"use strict";

/* 

    RzSigServerConns

*/

(class RzSigServerConns extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("connections to sigserver");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([RzSigServerConn]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
    this.removeAllSubnodes();
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
