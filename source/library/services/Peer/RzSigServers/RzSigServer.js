"use strict";

/**
 * @module library.services.Peer.RzSigServers
 */

/**
 * @class RzSigServer
 * @extends BMStorableNode
 * @classdesc RzSigServer represents a signal server for peer-to-peer connections.
 */
(class RzSigServer extends BMStorableNode {

  /**
   * @static
   * @description Generates a random peer ID.
   * @param {number} [length=10] - The length of the generated peer ID.
   * @returns {string} The generated peer ID.
   * @category Utility
   */
  static generateRandomPeerId (length = 10) {
    let result = '';
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;

    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  /**
   * @description Initializes the prototype slots for the RzSigServer.
   * @category Initialization
   */
  initPrototypeSlots () {

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
      /**
       * @member {string} host
       * @description The host of the signal server.
       * @category Configuration
       */
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
      /**
       * @member {string} path
       * @description The path of the signal server.
       * @category Configuration
       */
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
      /**
       * @member {number} port
       * @description The port of the signal server.
       * @category Configuration
       */
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
      /**
       * @member {string} key
       * @description The key for the signal server.
       * @category Configuration
       */
      const slot = this.newSlot("key", "");      
      slot.setInspectorPath("info")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("none")
    }

    {
      /**
       * @member {boolean} isSecure
       * @description Indicates if the connection to the signal server is secure.
       * @category Configuration
       */
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
      /**
       * @member {string} status
       * @description The status of the signal server connection.
       * @category Status
       */
      const slot = this.newSlot("status", null);      
      //slot.setInspectorPath("info")
      slot.setLabel("Status")
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
      /**
       * @member {RzSigServerPeers} peers
       * @description The peers connected to this signal server.
       * @category Connections
       */
      const slot = this.newSlot("peers", null)
      slot.setFinalInitProto(RzSigServerPeers);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
      slot.setSlotType("RzSigServerPeers");
    }

    {
      /**
       * @member {RzSigServerConns} sigServerConns
       * @description The connections to this signal server.
       * @category Connections
       */
      const slot = this.newSlot("sigServerConns", null)
      slot.setFinalInitProto(RzSigServerConns);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("RzSigServerConns");
    }

    {
      /**
       * @member {Action} refreshAction
       * @description The action to refresh peers.
       * @category Actions
       */
      const slot = this.newSlot("refreshAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Refresh Peers");
      //slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("refreshPeers");
    }

    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the RzSigServer instance.
   * @returns {RzSigServer} The initialized instance.
   * @category Initialization
   */
  init() {
    super.init();
    //this.setPeerConnections(new Map());
    this.setIsDebugging(true)
    this.setCanDelete(true)
    return this
  }

  /**
   * @description Performs final initialization of the RzSigServer instance.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setCanDelete(true)
    //this.refreshPeers()
  }

  /**
   * @static
   * @description Generates a full path for a given dictionary of server details.
   * @param {Object} dict - The dictionary containing server details.
   * @returns {string} The full path.
   * @category Utility
   */
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

  /**
   * @description Gets the full path of the signal server.
   * @returns {string} The full path.
   * @category Utility
   */
  fullPath () {
    return this.host() + ":" + this.port() + this.path() // path always begins with slash?
  }

  /**
   * @description Gets a dictionary representation of the signal server.
   * @returns {Object} The dictionary representation.
   * @category Data
   */
  dict () {
    const dict = {};
    dict.host = this.host();
    dict.path = this.path();
    dict.isSecure = this.isSecure();
    dict.port = this.port();
    //dict.webSocketPort = this.webSocketPort();
    return dict;
  }

  /**
   * @description Sets the signal server properties from a dictionary.
   * @param {Object} dict - The dictionary containing server details.
   * @returns {RzSigServer} The updated instance.
   * @category Configuration
   */
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

  /**
   * @description Gets the title of the signal server.
   * @returns {string} The title.
   * @category Display
   */
  title () {
    return this.host() 
  }

  /**
   * @description Gets the subtitle of the signal server.
   * @returns {string} The subtitle.
   * @category Display
   */
  subtitle () {
    //const http = this.httpProtocol();
    //const ws = secure ? "wss" : "ws";

    //return http + " " + this.port() + "\n" + ws + " " + this.webSocketPort();
    const summary = this.port() + " " + this.path() + " " + (this.isSecure() ? "secure" : "");
    return [summary, this.status()].join("\n");
    //return http + ":" + this.port() + ", " + ws + ":" + this.webSocketPort() + " " + (this.isSecure() ? "secure" : "");
  }

  /**
   * @description Gets the HTTP protocol of the signal server.
   * @returns {string} The HTTP protocol.
   * @category Utility
   */
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

  /**
   * @description Gets the URL for fetching peers.
   * @returns {string} The URL for fetching peers.
   * @category Utility
   */
  getPeersUrl () {
    return this.httpProtocol() + "://" + this.host() + ":" + this.port() + this.path() + '/api/peers';
  }

  /**
   * @description Refreshes the list of peers.
   * @returns {Promise<Array>} A promise that resolves to the array of peer IDs.
   * @category Peers
   */
  async refreshPeers () {
    const peerIds = await this.fetchPeerIds();
    this.peers().setPeerIdArray(peerIds)
    return peerIds
  }

  /**
   * @description Fetches the peer IDs from the signal server.
   * @returns {Promise<Array>} A promise that resolves to the array of peer IDs.
   * @category Peers
   */
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

  /**
   * @description Gets the available peer IDs.
   * @returns {Array<string>} An array of available peer IDs.
   * @category Peers
   */
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