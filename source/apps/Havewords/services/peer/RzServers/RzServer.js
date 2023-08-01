"use strict";

/* 
    RzServer

*/

(class RzServer extends BMStorableNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("info", null);
      slot.setShouldStoreSlot(true);
      slot.setFinalInitProto(RzServerInfo);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("peers", null)
      slot.setFinalInitProto(RzServerPeers);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("serverConns", null)
      slot.setFinalInitProto(RzServerConns);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("refreshAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Refresh Peers")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("refreshPeers");
    }

    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    //this.setPeerConnections(new Map());
    this.setIsDebugging(false)
    this.setCanDelete(true)
    return this
  }

  finalInit () {
    super.finalInit()
    this.setCanDelete(true)
    this.refreshPeers()
  }

  title () {
    const info = this.info()
    if (info) {
      return info.host() 
    }
    return null
  }

  subtitle () {
    const info = this.info()
    if (info) {
      return info.port() + " " + (info.isSecure() ? "secure" : "")
    }
    return null
  }

  /*
  shutdown () {
    this.peerConnections().valuesArray().forEach((conn) => {
      conn.shutdown();
    });
    return this;
  }
  */

  // --- getting peer list ----

  async refreshPeers () {
    const peerIds = await this.fetchPeerIds();
    this.peers().setPeerIdArray(peerIds)
  }

  async fetchPeerIds() { // Note this is a GET request, so we don't need to be connected to do this
    const url = this.info().getPeersUrl();
    console.log("getPeersUrl: '" + url + "'");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const peers = await response.json();
    return peers;
  }

  // --- connecting to a peer ----
  /*
  connectToPeerId (peerId) {
    const conn = this.peer().connect(peerId);
    const pc = PeerConnection.clone().setConn(conn)
    this.addPeerConnection(pc);
    return pc
  }
  */


}.initThisClass());
