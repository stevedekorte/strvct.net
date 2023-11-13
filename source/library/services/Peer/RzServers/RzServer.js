"use strict";

/* 
    RzServer

*/

(class RzServer extends BMStorableNode {
  initPrototypeSlots() {


    /*
    {
      host: "peerjssignalserver.herokuapp.com",
      path: "/peerjs",
      secure: true,
      port: 443,
      reliable: true,
      pingInterval: 1000, // 1 second
      debug: false
    }
    */

    {
      const slot = this.newSlot("host", "peerjssignalserver.herokuapp.com");      
      slot.setInspectorPath("info")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("path", "/peerjs");      
      slot.setInspectorPath("info")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("port", 443);      
      slot.setInspectorPath("info")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("isSecure", true);      
      slot.setInspectorPath("info")
      slot.setLabel("is secure")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("key value")
    }

    // -------------------

    {
      const slot = this.newSlot("peers", null)
      slot.setFinalInitProto(RzServerPeers);
      slot.setShouldStoreSlot(false);
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
    //this.refreshPeers()
  }

  static fullPathForDict (dict) {
    return dict.host + ":" + dict.port + dict.path
  }

  fullPath () {
    return this.host() + ":" + this.port() + this.path() // path always begins with slash?
  }

  setDict (dict) {
    /*
    sample dict:

    {
      host: "peerjssignalserver.herokuapp.com",
      path: "/peerjs",
      isSecure: true,
      port: 443,
      reliable: true,
      pingInterval: 1000, // 1 second TODO: change to pingIntervalMs
      debug: false
    }
    */

    assert(Type.isString(dict.host))
    this.setHost(dict.host)

    assert(Type.isString(dict.path))
    this.setPath(dict.path)

    assert(Type.isBoolean(dict.isSecure))
    this.setIsSecure(dict.isSecure === true)

    assert(Type.isInteger(dict.port))
    this.setPort(dict.port)

    // optional server connection defaults for this server

    /*
    if (dict.isReliable !== undefined) {
      assert(Type.isBoolean(dict.isReliable))
      this.setIsReliable(dict.isReliable)
    }

    if (dict.debug !== undefined) {
      assert(Type.isBoolean(dict.isReliable))
      this.setDebug(dict.debug)
    }

    if (dict.pingInterval !== undefined) {
      assert(Type.isNumber(dict.isReliable))
      this.setPingInterval(dict.pingInterval)
    }
    */

    return this
  }

  title () {
    return this.host() 
  }

  subtitle () {
    return this.port() + " " + (this.isSecure() ? "secure" : "");
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

  getPeersUrl () {
    return "https://" + this.host() + this.path() + '/api/peers';
  }

  async refreshPeers () {
    const peerIds = await this.fetchPeerIds();
    this.peers().setPeerIdArray(peerIds)
    return peerIds
  }

  async fetchPeerIds() { // Note this is a GET request, so we don't need to be connected to do this
    const url = this.getPeersUrl();
    this.debugLog("getPeersUrl: '" + url + "'");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const peers = await response.json();
    return peers;
  }

  availablePeerIds () {
    return this.peers().subnodes().map(rzPeer => rzPeer.title())
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

  // --- generate a valid peer id ---

  static generateRandomPeerId (length = 10) {
    let result = '';
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;

    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}


}.initThisClass());
