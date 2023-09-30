"use strict";

/* 
    PeerService

*/

(class PeerService extends BMSummaryNode {
  
  static initClass () {
    this.setIsSingleton(true)
    return this
  }

  initPrototypeSlots () {

    {
      const slot = this.newSlot("servers", null)
      slot.setFinalInitProto(RzServers)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("connections", null)
      slot.setFinalInitProto(PeerConnections)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Peer Network");
    this.setSubtitle("WebRTC");
  }

}.initThisClass());
