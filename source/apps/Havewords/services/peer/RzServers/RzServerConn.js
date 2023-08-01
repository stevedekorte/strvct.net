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
      slot.setInspectorPath("")
      slot.setLabel("is reliable")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    {
      const slot = this.newSlot("retryCount", 0);      
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    {
      const slot = this.newSlot("maxRetries", 3);      
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    {
      const slot = this.newSlot("pingIntervalMs", 1000);   
      slot.setInspectorPath("")
      slot.setLabel("ping interval in ms")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    {
      const slot = this.newSlot("debug", false);      
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
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
    const info = this.server().info()
    return {
      host: info.host(),
      path: info.path(),
      secure: info.isSecure(),
      port: info.port(),
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
    const peer = new Peer(undefined, this.peerOptions()); /* let server assign unique peer id */

    /*
    peer.__peerData = {
      // Your data here
    };
    */

    if (peer) {
      peer.on("open", (id) => this.onOpen(id) );
      peer.on("error", (error) => this.onError(error) );
      peer.on("call", (call) => this.onCall(call) );
      peer.on("connection", (conn) => this.onConnection(conn) )
      this.setPeer(peer);
    } else {
      this.setStatus("unknown connection error")
    }
    return this;
  }

  async onOpen (peerId) {
    this.setPeerId(peerId)
    this.debugLog("opened with peerId: '" + peerId + "'");
    this.setStatus("connected")
    //this.delegate().onPeerServerOpen()
  }
  
  addPeerConnection (pc) {
    pc.setServer(this)
    this.peerConnections().set(pc.id(), pc);
    return this;
  }

  onConnection (conn) {
    this.debugLog("incoming connection from: " + conn.peer)
    if (!this.allowsIncomingConnections()) {
      console.warn(this.type() + " attempted connection while allowsIncomingConnections is false");
      return this
    }

    const pc = this.peerConnectionClass().clone().setConn(conn);
    this.addPeerConnection(pc);
    /*
    // better to use onOpenPeerConnection as we can send messages after open
    if (this.delegate().onPeerConnection) {
      this.delegate().onPeerConnection(pc);
    }*/
    return this
  }

  onOpenPeerConnection (pc) {
    // sent by a PeerConnection to it's PeerServer after it opens
    // and is ready for messages
    if (this.delegate().onOpenPeerConnection) {
      this.delegate().onOpenPeerConnection(pc);
    }
  }

  onClosePeerConnection (pc) {
    if (this.delegate().onClosePeerConnection) {
      this.delegate().onClosePeerConnection(pc);
    }
    this.removePeerConnection(pc)
  }

  removePeerConnection (pc) {
    if (this.peerConnections().has(pc.id())) {
      this.peerConnections().delete(pc.id())
      if (this.delegate().onRemovePeerConnection) {
        this.delegate().onRemovePeerConnection(pc);
      }
    }
    return this
  }

  onError(err) {
    this.debugLog("error ", err);
    //debugger
    console.log("error: " + err.message)
    this.setStatus(err.message)

    const retryDelay = 5000

    if (this.retryCount() < this.maxRetries()) {
      setTimeout(() => {
        this.setRetryCount(this.retryCount() + 1);
        console.warn("Attempting to reconnect to PeerJS server... (attempt #" + this.retryCount() + ")");
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
      GroupChatColumn.shared().addChatMessage(
        "systemMessage",
        `Connection to peer server lost. Your existing connections still work, but you won't be able to make new connections or voice calls.`,
        "System"
      );
    }
  }

  onCall(call) {
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
  }


}.initThisClass());
