"use strict";

/**
 * @module library.services.Peer.RzSigServers.RzSigServerConns
 */

/**
 * @class RzSigServerConn
 * @extends BMStorableNode
 * @classdesc Wrapper for PeerJS Peer object.
 */
(class RzSigServerConn extends BMStorableNode {
  /**
   * @description Initializes the prototype slots for the RzSigServerConn class.

   */
  initPrototypeSlots () {

    /**
     * @member {string} name
     */
    {
      const slot = this.newSlot("name", null);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      //slot.setSummaryFormat("value")
    }

    /**
     * @member {string} peerIdPrefix
     */
    {
      const slot = this.newSlot("peerIdPrefix", "");
      slot.setInspectorPath("")
      slot.setLabel("our peer id root")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      //slot.setSummaryFormat("value")
    }

    /**
     * @member {string} peerId
     */
    {
      const slot = this.newSlot("peerId", null);
      slot.setInspectorPath("")
      slot.setLabel("our peer id")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      //slot.setSummaryFormat("value")
    }

    /**
     * @member {string} status
     */
    {
      const slot = this.newSlot("status", null);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      //slot.setSummaryFormat("value")
    }

    /**
     * @member {Peer} peer
     */
    {
      const slot = this.newSlot("peer", null);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(false);
      slot.setSlotType("Peer");
    }

    /**
     * @member {boolean} isReliable
     */
    {
      const slot = this.newSlot("isReliable", true);      
      slot.setInspectorPath("info")
      slot.setLabel("is reliable")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("key value")
    }

    /**
     * @member {Promise} connectPromise
     */
    {
      const slot = this.newSlot("connectPromise", null);
      slot.setSlotType("Promise");
    }

    /**
     * @member {number} getIdRetryCount
     */
    {
      const slot = this.newSlot("getIdRetryCount", 0); 
      slot.setSlotType("Number");
    }

    /**
     * @member {number} getIdRetryDelayMs
     */
    {
      const slot = this.newSlot("getIdRetryDelayMs", 100);
      slot.setSlotType("Number");
    }

    /**
     * @member {number} getIdMaxRetries
     */
    {
      const slot = this.newSlot("getIdMaxRetries", 100);
      slot.setSlotType("Number"); 
    }

    /**
     * @member {number} connectRetryDelayMs
     */
    {
      const slot = this.newSlot("connectRetryDelayMs", 5000);
      slot.setSlotType("Number");
    }

    /**
     * @member {number} connectRetryCount
     */
    {
      const slot = this.newSlot("connectRetryCount", 0);      
      slot.setInspectorPath("info")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("key value")
    }

    /**
     * @member {number} connectMaxRetries
     */
    {
      const slot = this.newSlot("connectMaxRetries", 3);      
      slot.setInspectorPath("info")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("key value")
    }

    /**
     * @member {number} pingIntervalMs
     */
    {
      const slot = this.newSlot("pingIntervalMs", 1000);   
      slot.setInspectorPath("info")
      slot.setLabel("ping interval in ms")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("key value")
    }

    /**
     * @member {boolean} debug
     */
    {
      const slot = this.newSlot("debug", false);      
      slot.setInspectorPath("info")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    /**
     * @member {RzPeerConns} peerConns
     */
    {
      const slot = this.newSlot("peerConns", null)
      slot.setFinalInitProto(RzPeerConns);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("RzPeerConns");
    }

    /**
     * @member {Action} connectAction
     */
    {
      const slot = this.newSlot("connectAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Connect")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("connect");
    }

    /**
     * @member {Action} disconnectAction
     */
    {
      const slot = this.newSlot("disconnectAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Disconnect")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("disconnect");
    }

    /**
     * @member {Action} destroyAction
     */
    {
      const slot = this.newSlot("destroyAction", null);
      slot.setCanInspect(true);
      slot.setInspectorPath("")
      slot.setLabel("Destroy")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("destroy");
    }

    /**
     * @member {Action} refreshPeersAction
     */
    {
      const slot = this.newSlot("refreshPeersAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Refresh Peers")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("refreshPeers");
    }

    /**
     * @member {Object} delegate
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
    }

    /**
     * @member {Error} error
     */
    {
      const slot = this.newSlot("error", null);
      slot.setSlotType("Error");
    }

    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the RzSigServerConn instance.

   * @returns {RzSigServerConn}
   */
  init() {
    super.init();
    this.setIsDebugging(false);
    this.setCanDelete(true);
    return this
  }

  /**
   * @description Performs final initialization of the RzSigServerConn instance.

   */
  finalInit () {
    super.finalInit();
    this.setSubtitle("server connection");
    this.setPeerId("");
    this.setStatus("unconnected");
    this.setCanDelete(true);
    this.setShouldStore(true);
  }

  /**
   * @description Sets the peer connection class.

   * @param {Class} aClass - The peer connection class to set.
   * @returns {RzSigServerConn}
   */
  setPeerConnClass (aClass) {
    this.peerConns().setSubnodeClasses([aClass])
    return this
  }

  /**
   * @description Gets the peer connection class.

   * @returns {Class} The peer connection class.
   */
  peerConnClass () {
    return this.peerConns().subnodeClasses().first()
  }

  /**
   * @description Gets the title of the RzSigServerConn instance.

   * @returns {string} The title.
   */
  title () {
    const id = this.peerId()
    return id ? id : "no peer id assigned"
  }

  /**
   * @description Gets the subtitle of the RzSigServerConn instance.

   * @returns {string} The subtitle.
   */
  subtitle () {
    return this.status()
  }

  /**
   * @description Checks if the RzSigServerConn is connected.

   * @returns {boolean} True if connected, false otherwise.
   */
  isConnected () {
    const isConnected = !Type.isNullOrUndefined(this.peer()) && !this.peer().disconnected;
    assert(Type.isBoolean(isConnected));
    return isConnected;
  }

  /**
   * @description Clears the connect promise.

   * @returns {RzSigServerConn}
   */
  clearConnectPromise () {
    this.setConnectPromise(null);
    return this;
  }

  /**
   * @description Gets the connect promise.

   * @returns {Promise} The connect promise.
   */
  connectPromise () {
    if (!this._connectPromise) {
      this._connectPromise = Promise.clone();
    }
    return this._connectPromise 
  }

  /**
   * @description Initiates a connection.

   * @returns {Promise} The connect promise.
   */
  connect () {
    if (!this.isConnected()) {
      this.setError(null);
      this.clearConnectPromise();
      this.setStatus("connecting");
      this.setGetIdRetryCount(0);
      this.setConnectRetryCount(0);
      this.attemptToConnect();
    }
    return this.connectPromise();
  }

  /**
   * @description Gets the connect action info.

   * @returns {Object} The connect action info.
   */
  connectActionInfo () {
    return {
      isEnabled: !this.isConnected()
    }
  }

  /**
   * @description Shuts down the RzSigServerConn.

   * @returns {RzSigServerConn}
   */
  shutdown () {
    this.disconnectAllPeers();
    this.disconnect();
    return this;
  }

  /**
   * @description Disconnects the RzSigServerConn.

   * @returns {RzSigServerConn}
   */
  disconnect () {
    if (this.peer()) {
      this.setStatus("disconnecting")
      this.peer().disconnect()
    }
    return this
  }

  /**
   * @description Disconnects all peers.

   * @returns {RzSigServerConn}
   */
  disconnectAllPeers () {
    this.peerConns().disconnectAllPeers();
    return this;
  }

  /**
   * @description Gets the disconnect action info.

   * @returns {Object} The disconnect action info.
   */
  disconnectActionInfo () {
    return {
      isEnabled: this.isConnected()
    }
  }

  /**
   * @description Destroys the RzSigServerConn.

   * @returns {RzSigServerConn}
   */
  destroy () {
    if (this.peer()) {
      this.setStatus("destroying")
      this.peer().destroy()
    }
    return this
  }

  /**
   * @description Gets the destroy action info.

   * @returns {Object} The destroy action info.
   */
  destroyActionInfo () {
    return {
      isEnabled: this.peer() !== null
    }
  }

  /**
   * @description Gets the signal server connections.

   * @returns {Object} The signal server connections.
   */
  sigServerConnections () {
    return this.parentNode()
  }

  /**
   * @description Gets the server.

   * @returns {Object} The server.
   */

  server () {
    return this.sigServerConnections().parentNode()
  }

  /*
  fullPeerId () {
    const id = this.peerId()
    const fullPath = this.server().httpFullPath()
    return fullPath + ":" + id
  }
  */

  /*
  peerOptions () {
    // Deployed peerjs server
    return {
        host: "peerjssignalserver.herokuapp.com",
        path: "/peerjs",
        secure: true,
        port: 443,
        reliable: true,
        pingInterval: 1000, // 1 second
        debug: false
      }
  }
  */

  /**
   * @description Gets the peer options.
   * @returns {Object} The peer options.
   */
  peerOptions () {
    const server = this.server();
    const options = {
      host: server.host(),
      path: server.path(),
      secure: server.isSecure(),
      port: server.port(),
      reliable: this.isReliable(),
      pingInterval: this.pingIntervalMs(),
      debug: this.debug()
    };
    
    const key = this.server().key().trim();
    if (key) {
      options.key = key;
    }

    return options;
  }

  // --- peer ---

  /**
   * @description Sets the peer object.

   * @param {Peer} aPeer - The peer object to set.
   * @returns {RzSigServerConn} The current instance.
   */
  setPeer (aPeer) {
    this._peer = aPeer;
    return this
  }

  /**
   * @description Gets the peer object.

   * @returns {Peer} The peer object.
   */
  peer () {
    return this._peer
  }

  // --- connect to signaling server ---

  /**
   * @description Generates a new peer ID.

   * @returns {string} The new peer ID.
   */
  newPeerId () {
    return this.peerIdPrefix() + "-" + RzSigServer.generateRandomPeerId(10)
  }

  /**
   * @description Attempts to connect to the signaling server.

   * @returns {RzSigServerConn} The current instance.
   */
  attemptToConnect () {
    this.debugLog("connecting to peerjs signal server: ", JSON.stringify(this.peerOptions(), null, 2) )

    let requestedPeerId = undefined;
    if (this.peerIdPrefix().length) {
      requestedPeerId = this.newPeerId()
    }
    const peer = new Peer(requestedPeerId, this.peerOptions()); /* let server assign unique peer id */

    if (peer) {
      peer.on("open", (id) => this.onOpen(id) );
      peer.on("connection", (conn) => this.onConnection(conn) );
      peer.on("call", (call) => this.onCall(call) );
      peer.on('close', () => this.onClose() );
      peer.on('disconnected', () => this.onDisconnected() );
      peer.on("error", (error) => this.onError(error) );
      this.setPeer(peer);
    } else {
      this.setStatus("unknown connection error")
    }
    return this;
  }

  /**
   * @description Handles the open event for the peer.

   * @param {string} peerId - The peer ID.
   * @returns {RzSigServerConn} The current instance.
   */
  async onOpen (peerId) {
    this.setPeerId(peerId)
    //this.debugLog("opened with peerId: '" + peerId + "'");
    this.setStatus("connected to server")
    //this.refreshPeers()
    this.sendDelegateMessage("onSigServerOpen", [this]);
    this.connectPromise().callResolveFunc();
  }

  // --- incoming peer connections ---

  /**
   * @description Adds a peer connection to the server.

   * @param {RzPeerConn} aPeerConn - The peer connection to add.
   * @returns {RzSigServerConn} The current instance.
   */
  addPeerConnection (aPeerConn) {
    aPeerConn.setSigServerConn(this)
    this.peerConns().addSubnode(aPeerConn)
    return this;
  }

  /**
   * @description Handles the close event for the peer.

   * @returns {RzSigServerConn} The current instance.
   */
  onClose () {
    /*
    Emitted when the peer is destroyed and can no longer accept or create any new connections. 
    At this time, the peer's connections will all be closed.
    */

    this.setPeerId("") // only if we are having the server assign the id...
    this.setStatus("closed")
    this.sendDelegateMessage("onSigServerClose", [this])
  }

  /**
   * @description Handles the disconnected event for the peer.

   * @returns {RzSigServerConn} The current instance.
   */
  onDisconnected () {
    /*
    Emitted when the peer is disconnected from the signalling server, 
    either manually or because the connection to the signalling server was lost. 
    
    When a peer is disconnected, its existing connections will stay alive, 
    but the peer cannot accept or create any new connections. 
    
    You can reconnect to the server by calling peer.reconnect().
    */

    this.setStatus("disconnected")
    this.sendDelegateMessage("onSigServerDisconnected", [this])
  }

  /**
   * @description Handles the connection event for the peer.

   * @param {Object} conn - The connection object.
   * @returns {RzSigServerConn} The current instance.
   */
  onConnection (conn) {
    // incoming connection

    const id = conn.peer;
    this.debugLog("incoming connection from: " + id)

    const peerConn = this.peerConns().addIfAbsentPeerConnForId(id)
    peerConn.setConn(conn)
    
    // better to use onOpenPeerConnection as we can send messages after open
    this.sendDelegateMessage("onPeerConnection", [peerConn])

    return this
  }

  /**
   * @description Handles the open peer connection event.

   * @param {RzPeerConn} peerConn - The peer connection object.
   * @returns {RzSigServerConn} The current instance.
   */
  onOpenPeerConnection (peerConn) {
    // sent by a PeerConnection to it's SigServer after it opens
    // and is ready for messages
    this.sendDelegateMessage("onPeerConnection", [peerConn])
  }

  /**
   * @description Handles the close peer connection event.

   * @param {RzPeerConn} peerConn - The peer connection object.
   * @returns {RzSigServerConn} The current instance.
   */
  onClosePeerConnection (peerConn) {
    this.sendDelegateMessage("onClosePeerConnection", [peerConn])
    this.removePeerConnection(peerConn)
  }

  /**
   * @description Removes a peer connection.

   * @param {RzPeerConn} peerConn - The peer connection object.
   * @returns {RzSigServerConn} The current instance.
   */
  removePeerConnection (peerConn) {
    //if (this.peerConnections().has(pc.id())) {
      this.sendDelegateMessage("onRemovePeerConnection", [peerConn])
    //}

    return this
  }

  // --- error handling ---

  /**
   * @description Handles the error event for the peer.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onError (error) {
    //this.debugLog("error ", error);
    //debugger
    console.log("error: " + error.message);
    this.setStatus(error.message);
    this.setError(error);

    const etype =  error.type
    let errorMethodRoot = etype.split("-").map(s => s.capitalized()).join("") //+ "Error";
    if (!errorMethodRoot.endsWith("Error")) {
      errorMethodRoot += "Error";
    }
    const errorMethodName = "on" + errorMethodRoot;

    //debugger;

    // send self error message
    const method = this[errorMethodName]
    if (method) {
      method.apply(this, [error])
    } else {
      throw new Error("missing error handler method '" + errorMethodName + "'")
    }

    // send delegate error message 
    const delegateErrorMethodName = "onSignalServer" + errorMethodRoot;
    this.sendDelegateMessage(delegateErrorMethodName, [this, error])

    //this.connectPromise().callRejectFunc();
  }

  // --- error type handlers ---

  /**
   * @description Handles the peer unavailable error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onPeerUnavailableError (error) {
    console.warn(this.typeId() + " error: ", error)
  }

  /**
   * @description Handles the browser incompatible error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onBrowserIncompatibleError (error) {
    // ERRORFATAL
    // The client's browser does not support some or all WebRTC features that you are trying to use.
  }

  /**
   * @description Handles the disconnected error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onDisconnectedError (error) {
    // ERROR
    // You've already disconnected this peer from the server and can no longer make any new connections on it.
  }

  /**
   * @description Handles the invalid ID error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onInvalidIdError (error) {
    // ERRORFATAL
    // The ID passed into the Peer constructor contains illegal characters.
  }

  /**
   * @description Handles the invalid key error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onInvalidKeyError (error) {
    // ERRORFATAL
    // The API key passed into the Peer constructor contains illegal characters or is not in the system (cloud server only).
  }

  /**
   * @description Handles the network error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onNetworkError (error) {
    // ERROR
    // Lost or cannot establish a connection to the signalling server.
  }

  /**
   * @description Handles the peer unavailable error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onPeerUnavailableError (error) {
    // ERROR
    // The peer you're trying to connect to does not exist.
  }

  /**
   * @description Handles the SSL unavailable error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onSslUnavailableError (error) { 
    // ERRORFATAL
    // PeerJS is being used securely, but the cloud server does not support SSL. Use a custom SigServer.
  }

  /**
   * @description Handles the server error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onServerError (error) {
    // ERRORFATAL
    // Unable to reach the server.
  }

  /**
   * @description Handles the socket error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onSocketError (error) {
    // ERRORFATAL
    // An error from the underlying socket.
  }

  /**
   * @description Handles the socket closed error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onSocketClosedError (error) {
    // ERRORFATAL
    // The underlying socket closed unexpectedly.

    // TODO: retry?
  }

  /**
   * @description Handles the unavailable ID error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onUnavailableIdError (error) {
    // ERRORSOMETIMES FATAL
    // The ID passed into the Peer constructor is already taken.
    // This error is not fatal if your peer has open peer-to-peer connections. 
    // This can happen if you attempt to reconnect a peer that has been disconnected from the server, but its old ID has now been taken.
    if (this.peerIdPrefix()) {
      this.retryClosure(() => {
        debugger;
        this.attemptToConnect()
      })
    }
  }

  /**
   * @description Gets the retry closure for ID retrieval.

   * @param {Function} func - The function to execute.
   * @returns {RzSigServerConn} The current instance.
   */
  getIdRetryClosure (func) {
    if (this.getIdRetryCount() < this.getIdMaxRetries()) {
      this.setGetIdRetryCount(this.getIdRetryCount() + 1);
      this.addTimeout(() => {
        console.warn(this.typeId() + " retry get id");
        func();
      }, this.getIdRetryDelayMs());
    } else {
      console.warn(this.typeId() + " reached max get id retries");
    }
    return this
  }

  /**
   * @description Handles the WebRTC error.

   * @param {Error} error - The error object.
   * @returns {RzSigServerConn} The current instance.
   */
  onWebrtcError (error) {
    // ERROR
    // Native WebRTC errors.
  }

  // --- reconnect ---

  /**
   * @description Attempts to reconnect to the signaling server.

   * @returns {RzSigServerConn} The current instance.
   */
  attemptToReconnect () {

    if (this.connectRetryCount() < this.connectMaxRetries()) {
      setTimeout(() => {
        this.setConnectRetryCount(this.connectRetryCount() + 1);
        if (!this.isConnected()) {
          this.setStatus(this.status() + " retry #" + this.connectRetryCount()) // + " in " + (this.connectRetryDelayMs()/1000) + " secs")
          this.attemptToConnect()
        } else {
          this.peer().reconnect(); // TODO: will this call onConnection again?
        }
      }, this.connectRetryDelayMs());
    } else {
      debugger
      const warning = "Reached maximum number of " + this.maxRetries() + " retries.";
      console.warn(this.type() + " " + warning);
      this.setStatus(warning)
      // Display a system message here, e.g. by updating the UI
    }
  }

  /**
   * @description Handles the call event.

   * @param {Object} call - The call object.
   * @returns {RzSigServerConn} The current instance.
   */
  onCall (call) {
    /*

    // Answer incoming voice call
    const acceptCall = confirm(
      `Incoming call. Do you want to accept the call?`
    );

    if (acceptCall) {
      call.answer(Microphone.shared().userAudioStream());
      console.log("Answering incoming call from:", call.peer);

      call.on("stream", (remoteStream) => {
        handleRemoteStream(remoteStream);
        updateCalleeVoiceRequestButton(call.peer, call);
      });

      call.on("close", () => {
        // Handle call close event
        console.log("Call with peer:", call.peer, "has ended");
      });
    } else {
      console.log("Call from", call.peer, "rejected");
    }
    */
  }

  // --- peers ---

  /**
   * @description Gets the available peer IDs.

   * @returns {Array} The available peer IDs.
   */
  availablePeerIds () {
    return this.server().availablePeerIds()
  }

  /**
   * @description Gets the connection to a peer ID.

   * @param {string} peerId - The peer ID.
   * @returns {RzPeerConn} The peer connection object.
   */
  connectionToPeerId (peerId) {
    const peerConn = this.peerConnClass().clone().setPeerId(peerId)
    this.addPeerConnection(peerConn)
    //peerConn.connect() // caller should call connect() after setting up peerConn
    return peerConn // the caller should problaby call peerConn.setDelegate(this) and handling it's delegate messages
  }

  /**
   * @description Connects to a peer ID.

   * @param {string} peerId - The peer ID.
   * @returns {RzPeerConn} The peer connection object.
   */
  connectToPeerId (peerId) {
    const peerConn = this.connectionToPeerId(peerId)
    peerConn.connect()
    return peerConn // the caller should problaby call peerConn.setDelegate(this) and handling it's delegate messages
  }

  /**
   * @description Gets the unconnected peer connections.

   * @returns {Array} The unconnected peer connections.
   */
  unconnectedPeerConns () {
    return this.peerConns().subnodes().select(pc => !pc.isConnected())
  }

  /**
   * @description Refreshes the peers.

   * @returns {RzSigServerConn} The current instance.
   */
  async refreshPeers () {
    // NOTE: we want to be able to use custom peerConnClass and we don't want to remove 
    // subnodes on refresh. Maybe we should separate availablePeers from peerConns?
    
    /*
    // compose this for fast lookup - TODO: use subnode index instead of building index
    const idToPeerMap = new Map();
    this.peerConns().subnodes().forEach(pc => idToPeerMap.set(pc.peerId(), pc));

    const newPeerIds = await this.server().fetchPeerIds()
    newPeerIds.sort()
    newPeerIds.remove(this.peerId())

    const newSubnodes = newPeerIds.map(id => {
      let pc = idToPeerMap.at(id)
      if (!pc) {
        pc = RzPeerConn.clone().setPeerId(id).setSigServerConn(this)
      }
      return pc
    })

    if (!this.subnodes().isEqual(newSubnodes)) {
      this.peerConns().removeAllSubnodes()
      this.peerConns().addSubnodes(newSubnodes)
    }

    // what should we do with connected peers that are no longer in the peer id list?
    // should we leave them in the list or shut them down?
    */

    return this
  }

  // --- delegate ---

  /**
   * @description Sends a delegate message.

   * @param {string} methodName - The method name.
   * @param {Array} args - The arguments.
   * @returns {RzSigServerConn} The current instance.
   */
  sendDelegateMessage (methodName, args = []) {
    const d = this.delegate();
    if (d) {
      const m = d[methodName];
      if (m) {
        m.apply(d, args);
      }
    }
  }


}.initThisClass());
