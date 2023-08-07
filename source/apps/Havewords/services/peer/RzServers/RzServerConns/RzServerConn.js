"use strict";

/* 
    RzServerConn

*/

(class RzServerConn extends BMStorableNode {
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

    {
      const slot = this.newSlot("retryCount", 0);      
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
      const slot = this.newSlot("maxRetries", 3);      
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

    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setIsDebugging(false)
    this.setCanDelete(true)
    return this
  }

  finalInit () {
    super.finalInit()
    this.setSubtitle("server connection")
    this.setPeerId("")
    this.setStatus("unconnected")
    this.setCanDelete(true)
  }

  title () {
    const id = this.peerId()
    return id ? id : "no peer id assigned"
  }

  subtitle () {
    return this.status()
  }

  /*
  shutdown () {
    this.peerConnections().valuesArray().forEach((conn) => {
      conn.shutdown();
    });
    return this;
  }
  */

  isConnected () {
    return this.peer() && !this.peer().disconnected
  }

  connect () {
    if (!this.isConnected()) {
      this.setStatus("connecting")
      this.setRetryCount(0)
      this.attemptToConnect()
    }
    return this
  }

  connectActionInfo () {
    return {
      isEnabled: !this.isConnected()
    }
  }


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

  // --- connecting to a peer ----
  /*
  connectToPeerId (peerId) {
    const conn = this.peer().connect(peerId);
    const pc = PeerConnection.clone().setConn(conn)
    this.addPeerConnection(pc);
    return pc
  }
  */

  serverConnections () {
    return this.parentNode()
  }

  server () {
    return this.serverConnections().parentNode()
  }

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
    const server = this.server()
    return {
      host: server.host(),
      path: server.path(),
      secure: server.isSecure(),
      port: server.port(),
      reliable: this.isReliable(),
      pingInterval: this.pingIntervalMs(),
      debug: this.debug()
    }
  }

  setPeer (aPeer) {
    this._peer = aPeer;
    return this
  }

  peer () {
    return this._peer
  }

  attemptToConnect () {
    /*
    const json1 = JSON.stableStringify(this.peerOptions(), 2, 2)
    const json2 = JSON.stableStringify(this.peerOptions2(), 2, 2)
    console.log(json1)
    console.log(json2)
    assert(json1 === json2)
    */
    //console.log("getPeers: ", await this.getPeers());
    //this.setStatus("connection attempt #"  + this.retryCount())

    //const id = LocalUser.shared().id();
    //this.debugLog("connecting to peerjs rendezvous server")
    console.log("connecting to peerjs rendezvous server: ", JSON.stringify(this.peerOptions(), 2, 2) )
    //debugger;
    const requestedPeerId = this.peerId() ? this.peerId() : undefined;
    const peer = new Peer(requestedPeerId, this.peerOptions()); /* let server assign unique peer id */

    /*
    peer.__peerData = {
      // Your data here
    };
    */

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
    this.refreshPeers()
    this.sendDelegateMessage("onPeerServerOpen")
  }

  // --- incoming peer connections ---
  
  addPeerConnection (aPeerConn) {
    aPeerConn.setServerConn(this)
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
  }

  onConnection (conn) {
    const id = conn.peer;
    this.debugLog("incoming connection from: " + id)

    const peerConn = this.peerConns().addIfAbsentPeerConnForId(id)
    peerConn.setConn(conn)
    
    // better to use onOpenPeerConnection as we can send messages after open
    this.sendDelegateMessage("onPeerConnection", [peerConn])

    return this
  }

  onOpenPeerConnection (peerConn) {
    // sent by a PeerConnection to it's PeerServer after it opens
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

  onError (error) {
    this.debugLog("error ", error);
    //debugger
    console.log("error: " + error.message)
    this.setStatus(error.message)

    const etype =  error.type
    const errorMethodName = "on" + etype.split("-").map(s => s.capitalized()).join() + "Error";
    const method = this[errorMethodName]
    if (method) {
      method.apply(this, [error])
    } else {
      throw new Error("missing error handler method '" + errorMethodName + "'")
    }
  }

  onBrowserIncompatible (error) {
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
    // PeerJS is being used securely, but the cloud server does not support SSL. Use a custom PeerServer.
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
    // This error is not fatal if your peer has open peer-to-peer connections. This can happen if you attempt to reconnect a peer that has been disconnected from the server, but its old ID has now been taken.
  }

  onWebrtcError (error) {
    // ERROR
    // Native WebRTC errors.
  }

  attemptToReconnect () {
    const retryDelay = 5000

    if (this.retryCount() < this.maxRetries()) {
      setTimeout(() => {
        this.setRetryCount(this.retryCount() + 1);
        if (!this.isConnected()) {
          this.setStatus(this.status() + " retry #" + this.retryCount()) // + " in " + (retryDelay/1000) + " secs")
          this.attemptToConnect()
        } else {
          this.peer().reconnect(); // TODO: will this call onConnection again?
        }
      }, retryDelay);
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

  connectToPeerId (peerId) {
    const peerConn = RzPeerConn.clone().setPeerId(peerId)
    this.addPeerConnection(peerConn)
    peerConn.connect()
    return this
  }

  unconnectedPeerConns () {
    return this.peerConns().subnodes().select(pc => !pc.isConnected())
  }

  async refreshPeers () {
    // compose this for fast lookup - TODO: use subnode index instead of building index
    const idToPeerMap = new Map();
    this.peerConns().subnodes().forEach(pc => idToPeerMap.set(pc.peerId(), pc));

    const newPeerIds = await this.server().fetchPeerIds()
    newPeerIds.sort()
    newPeerIds.remove(this.peerId())

    const newSubnodes = newPeerIds.map(id => {
      let pc = idToPeerMap.at(id)
      if (!pc) {
        pc = RzPeerConn.clone().setPeerId(id).setServerConn(this)
      }
      return pc
    })

    if (!this.subnodes().isEqual(newSubnodes)) {
      this.peerConns().removeAllSubnodes()
      this.peerConns().addSubnodes(newSubnodes)
    }

    // what should we do with connected peers that are no longer in the peer id list?
    // should we leave them in the list or shut them down?

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
