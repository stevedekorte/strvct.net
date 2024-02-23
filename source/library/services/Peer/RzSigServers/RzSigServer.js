"use strict";

/* 
    RzSigServer

*/

(class RzSigServer extends BMStorableNode {

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

  // --- prototype ---

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
      slot.setInspectorPath("info");
      slot.setLabel("port");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSummaryFormat("value");
    }

    /*
    {
      const slot = this.newSlot("webSocketPort", 443);      
      slot.setInspectorPath("info")
      slot.setLabel("WebSocket Port")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }
    */

    {
      const slot = this.newSlot("key", "");      
      slot.setInspectorPath("info")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("")
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

    {
      const slot = this.newSlot("status", null);      
      //slot.setInspectorPath("info")
      slot.setLabel("status")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(false)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    // -------------------

    {
      const slot = this.newSlot("peers", null)
      slot.setFinalInitProto(RzSigServerPeers);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("sigServerConns", null)
      slot.setFinalInitProto(RzSigServerConns);
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
    this.setIsDebugging(true)
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

  /*
  httpFullPath () {
    return this.host() + ":" + this.port() + this.path() // path always begins with slash?
  }

  webSocketFullPath () {
    return this.host() + ":" + this.webSocketPort() + this.path() // path always begins with slash?
  }
  */

  fullPath () {
    return this.host() + ":" + this.port() + this.path() // path always begins with slash?
  }

  dict () {
    const dict = {};
    dict.host = this.host();
    dict.path = this.path();
    dict.isSecure = this.isSecure();
    dict.port = this.port();
    //dict.webSocketPort = this.webSocketPort();
    return dict;
  }

  setDict (dict) {
    /*
    sample dict:

    {
      host: "peerjssignalserver.herokuapp.com",
      path: "/peerjs",
      isSecure: true,
      port: 443,
      webSocketPort: 443,
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

    //assert(Type.isInteger(dict.webSocketPort))
    //this.setPort(dict.webSocketPort)

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
    //const http = this.httpProtocol();
    //const ws = secure ? "wss" : "ws";

    //return http + " " + this.port() + "\n" + ws + " " + this.webSocketPort();
    const summary = this.port() + " " + this.path() + " " + (this.isSecure() ? "secure" : "");
    return [summary, this.status()].join("\n");
    //return http + ":" + this.port() + ", " + ws + ":" + this.webSocketPort() + " " + (this.isSecure() ? "secure" : "");
  }

  httpProtocol () {
    const secure = this.isSecure();
    return secure ? "https" : "http"; 
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
    return this.httpProtocol() + "://" + this.host() + ":" + this.port() + this.path() + '/api/peers';
  }

  async refreshPeers () {
    const peerIds = await this.fetchPeerIds();
    this.peers().setPeerIdArray(peerIds)
    return peerIds
  }

  async fetchPeerIds() { // Note this is a GET request, so we don't need to be connected to do this
    this.setStatus("");

    try {
      const url = this.getPeersUrl();
      this.debugLog("getPeersUrl: '" + url + "'");

      const options = {
        method: 'GET', // HTTP method
        headers: {
          'Authorization': `Bearer ${this.key()}`, // Passing the API key in the Authorization header
          'Content-Type': 'application/json' // Assuming JSON data is expected
        }
      }

      if (this.key()) {
        options.headers['x-peer-key'] = this.key();
      }

      console.log("headers: ", JSON.stringify(options, 2, 2));

      const promise = fetch(url, options);
      const response = await promise;
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const peers = await response.json();
      return peers;
    } catch (error) {
      this.setStatus("ERROR: " + error.message);
      return [];
    }
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


}.initThisClass());
