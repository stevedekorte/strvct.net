"use strict";

/* 
    RzSigServerConn

    Wrapper for PeerJS Peer object.

*/

(class RzSigServerConn extends BMStorableNode {
  initPrototypeSlots() {

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

    {
      const slot = this.newSlot("peer", null);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(false);
    }

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

    // --- connection prompise ---

    {
      const slot = this.newSlot("connectPromise", null);
    }

    // --- get id retries ---

    {
      const slot = this.newSlot("getIdRetryCount", 0);   
    }

    {
      const slot = this.newSlot("getIdRetryDelayMs", 100);   
    }

    {
      const slot = this.newSlot("getIdMaxRetries", 100);   
    }

    // --- connect retries ---

    {
      const slot = this.newSlot("connectRetryDelayMs", 5000);   
    }

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

    // --- ping / pong ---

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

    {
      const slot = this.newSlot("peerConns", null)
      slot.setFinalInitProto(RzPeerConns);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

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

    {
      const slot = this.newSlot("delegate", null);
    }

    {
      const slot = this.newSlot("error", null);
    }

    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setIsDebugging(true)
    this.setCanDelete(true)
    return this
  }

  finalInit () {
    super.finalInit()
    this.setSubtitle("server connection")
    this.setPeerId("")
    this.setStatus("unconnected")
    this.setCanDelete(true)
    this.setShouldStore(true)
  }

  // --- peer connection class ---

  setPeerConnClass (aClass) {
    this.peerConns().setSubnodeClasses([aClass])
    return this
  }

  peerConnClass () {
    return this.peerConns().subnodeClasses().first()
  }

  // --- title / subtitle ---

  title () {
    const id = this.peerId()
    return id ? id : "no peer id assigned"
  }

  subtitle () {
    return this.status()
  }

  // --- connect ---

  isConnected () {
    const isConnected = !Type.isNullOrUndefined(this.peer()) && !this.peer().disconnected;
    assert(Type.isBoolean(isConnected));
    return isConnected;
  }

  clearConnectPromise () {
    this.setConnectPromise(null);
    return this;
  }

  connectPromise () {
    if (!this._connectPromise) {
      this._connectPromise = Promise.clone();
    }
    return this._connectPromise 
  }

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

  connectActionInfo () {
    return {
      isEnabled: !this.isConnected()
    }
  }

  // --- disconnect ---

  disconnect () {
    if (this.peer()) {
      this.setStatus("disconnecting")
      this.peer().disconnect()
    }
    return this
  }

  disconnectActionInfo () {
    return {
      isEnabled: this.isConnected()
    }
  }

  // --- destroy ---

  destroy () {
    if (this.peer()) {
      this.setStatus("destroying")
      this.peer().destroy()
    }
    return this
  }

  destroyActionInfo () {
    return {
      isEnabled: this.peer() !== null
    }
  }

  /*
  shutdown () {
    this.peerConnections().valuesArray().forEach((conn) => {
      conn.shutdown();
    });
    return this;
  }
  */

  // --- connecting to a peer ----

  sigServerConnections () {
    return this.parentNode()
  }

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

  setPeer (aPeer) {
    this._peer = aPeer;
    return this
  }

  peer () {
    return this._peer
  }

  // --- connect to signaling server ---

  newPeerId () {
    return this.peerIdPrefix() + "-" + RzSigServer.generateRandomPeerId(10)
  }

  attemptToConnect () {
    this.debugLog("connecting to peerjs signal server: ", JSON.stringify(this.peerOptions(), 2, 2) )

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

  async onOpen (peerId) {
    this.setPeerId(peerId)
    this.debugLog("opened with peerId: '" + peerId + "'");
    this.setStatus("connected to server")
    //this.refreshPeers()
    this.sendDelegateMessage("onSigServerOpen", [this]);
    this.connectPromise().callResolveFunc();
  }

  // --- incoming peer connections ---
  
  addPeerConnection (aPeerConn) {
    aPeerConn.setSigServerConn(this)
    this.peerConns().addSubnode(aPeerConn)
    return this;
  }

  onClose () {
    /*
    Emitted when the peer is destroyed and can no longer accept or create any new connections. 
    At this time, the peer's connections will all be closed.
    */

    this.setPeerId("") // only if we are having the server assign the id...
    this.setStatus("closed")
    this.sendDelegateMessage("onSigServerClose", [this])
  }

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

  onOpenPeerConnection (peerConn) {
    // sent by a PeerConnection to it's SigServer after it opens
    // and is ready for messages
    this.sendDelegateMessage("onPeerConnection", [peerConn])
  }

  onClosePeerConnection (peerConn) {
    this.sendDelegateMessage("onClosePeerConnection", [peerConn])
    this.removePeerConnection(peerConn)
  }

  removePeerConnection (peerConn) {
    //if (this.peerConnections().has(pc.id())) {
      this.sendDelegateMessage("onRemovePeerConnection", [peerConn])
    //}

    return this
  }

  // --- error handling ---

  onError (error) {
    //this.debugLog("error ", error);
    //debugger
    console.log("error: " + error.message);
    this.setStatus(error.message);
    this.setError(error.message);

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

  onPeerUnavailableError (error) {
    console.warn(this.typeId() + " error: ", error)
  }

  onBrowserIncompatibleError (error) {
    // ERRORFATAL
    // The client's browser does not support some or all WebRTC features that you are trying to use.
  }

  onDisconnectedError (error) {
    // ERROR
    // You've already disconnected this peer from the server and can no longer make any new connections on it.
  }

  onInvalidIdError (error) {
    // ERRORFATAL
    // The ID passed into the Peer constructor contains illegal characters.
  }

  onInvalidKeyError (error) {
    // ERRORFATAL
    // The API key passed into the Peer constructor contains illegal characters or is not in the system (cloud server only).
  }

  onNetworkError (error) {
    // ERROR
    // Lost or cannot establish a connection to the signalling server.
  }

  onPeerUnavailableError (error) {
    // ERROR
    // The peer you're trying to connect to does not exist.
  }

  onSslUnavailableError (error) { 
    // ERRORFATAL
    // PeerJS is being used securely, but the cloud server does not support SSL. Use a custom SigServer.
  }

  onServerError (error) {
    // ERRORFATAL
    // Unable to reach the server.
  }

  onSocketError (error) {
    // ERRORFATAL
    // An error from the underlying socket.
  }

  onSocketClosedError (error) {
    // ERRORFATAL
    // The underlying socket closed unexpectedly.

    // TODO: retry?
  }

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

  onWebrtcError (error) {
    // ERROR
    // Native WebRTC errors.
  }

  // --- reconnect ---

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

  availablePeerIds () {
    return this.server().availablePeerIds()
  }

  connectionToPeerId (peerId) {
    const peerConn = this.peerConnClass().clone().setPeerId(peerId)
    this.addPeerConnection(peerConn)
    //peerConn.connect() // caller should call connect() after setting up peerConn
    return peerConn // the caller should problaby call peerConn.setDelegate(this) and handling it's delegate messages
  }

  connectToPeerId (peerId) {
    const peerConn = this.connectionToPeerId(peerId)
    peerConn.connect()
    return peerConn // the caller should problaby call peerConn.setDelegate(this) and handling it's delegate messages
  }

  unconnectedPeerConns () {
    return this.peerConns().subnodes().select(pc => !pc.isConnected())
  }

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
