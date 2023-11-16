"use strict";

/* 
    RzPeerConn

    Wrapper for PeerJS DataConnection.

    Delegate messages:

      - onPeerOpen (peerConn)
      - onPeerClose (peerConn)
      - onPeerData (peerConn, data)
      - onPeerError (peerConn)
    
*/

(class RzPeerConn extends BMSummaryNode {

  connOptionsDefault () {
    return {
      label: undefined,
      metadata: {},
      serialization: "json",
      reliable: true, // true ensures no dropped messages 
      /*
      config: {
        iceServers: [
          { url: 'stun:stun1.example.net' },
          { url: 'turn:turn.example.org', username: 'user', credential: 'pass' }
        ]
      } // Allows passing a custom WebRTC configuration. 
      */
    }
  }

  initPrototypeSlots() {
    {
      const slot = this.newSlot("peerId", null);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      //slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("connOptions", null);
      slot.setInspectorPath("")
      //slot.setLabel("connection options")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
    }


    {
      const slot = this.newSlot("status", "");
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      //slot.setSummaryFormat("value")
    }

    // --- error and reconnect ---

    {
      const slot = this.newSlot("error", null); 
      slot.setShouldStoreSlot(false)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("didInitiateConnection", false); // if we initiated, it's up to us to try to reconnect
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setSlotType("Boolean")
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("shouldAutoReconnect", true) // (if didInitiateConnection is also true)
      slot.setShouldStoreSlot(true);
      slot.setSlotType("Boolean")
    }

    {
      const slot = this.newSlot("reconnectAttemptCount", 0)
      slot.setShouldStoreSlot(true);
      slot.setSlotType("Number")
    }

    // -------------------------

    {
      const slot = this.newSlot("peerMsgs", null)
      slot.setFinalInitProto(RzMsgs);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("shutdownAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Shutdown")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("shutdown");
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
      const slot = this.newSlot("sigServerConn", null);
    }

    {
      const slot = this.newSlot("conn", null);
    }

    {
      const slot = this.newSlot("info", null);
    }

    {
      const slot = this.newSlot("delegate", null);
    }


    {
      const slot = this.newSlot("useMessageLog", false);
    }

    // --- ping pong keepalive ---

    {
      const slot = this.newSlot("useKeepAlive", false);
    }

    {
      const slot = this.newSlot("nextPingTimeout", null);
    }

    {
      const slot = this.newSlot("gotPong", false);
    }

    {
      const slot = this.newSlot("nextPingTimeoutMs", 30*1000); 
    }

    // --- msg chunking --

    {
      const slot = this.newSlot("chunks", null); 
    }


    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true)
  }

  id () {
    const conn = this.conn();
    if (conn) {
      return conn.peer;
    }
    return null;
  }

  shortId () {
    const id = this.id() 
    return id ? this.id().slice(0,5) + "..." : "null";
  }

  debugTypeId () {
    return this.type() + " " + this.shortId();
  }

  init() {
    super.init();
    this.setStatus("offline");
    this.setIsDebugging(true);
    this.setConnOptions(this.connOptionsDefault());
    this.setChunks(new Map());
    return this;
  }

  title () {
    return this.peerId()
  }

  subtitle () {
    if (this.isServerConn()) {
      return "ourself"
    }

    return this.status()
  }

  setConn (conn) {
    this._conn = conn;
    if (conn) {
      this.setPeerId(conn.peer);
      this.setupConn();
      this.watchOnceForNote("onDocumentBeforeUnload");
    }
    return this;
  }

  setupConn  () {
    const conn = this.conn();
    conn.on("data", (data) => this.onData(data));
    conn.on("open", () => this.onOpen());
    conn.on("close", () => this.onClose());
    conn.on("error", (error) => this.onError(error));
    this.setStatus("connected to peer")
  }

  isServerConn () {
    if (this.sigServerConn()) {
      return this.peerId() === this.sigServerConn().peerId()
    }
    return false
  }

  isConnected () {
    return this.isOpen()
  }

  isOpen () {
    return this.conn() && this.conn().open
  }

  // --- connection options ---

  // --- label ---

  setConnLabel (s) {
    // the label we pass when we initiate a connection
    this.connOptions().label = s
    return this
  }

  connLabel () {
    // the label we pass when we initiate a connection
    return this.connOptions().label
  }

  peerLabel () {
    // the label we receive when we accept a connection
    return this.conn().label
  }

  // --- metadata ---

  localMetadata () {
    // metadata we'll share with peer when we connect
    return this.connOptions().metadata;
  }

  remoteMetadata () {
    // metadata the peer shared with us when we connected
    if (this.conn()) {
      return this.conn().metadata;
    }
    return null
  }

  // --------------------------------

  connect () {
    this.setDidInitiateConnection(true)
    if (this.isServerConn()) {
      this.setStatus("can't connect to our own peer id")
      return this
    }

    const peer = this.sigServerConn().peer();
    if (peer) {
      const conn = peer.connect(this.peerId(), this.connOptions());
      this.setConn(conn)
      this.setDidInitiateConnection(true)
    } else {
      this.setStatus("can't connect to peer when server connection is offline")
    }
  }

  // --- events ---

  onOpen () {
    this.debugLog("onOpen");
    this.clearChunks();
    if (this.useKeepAlive()) {
      this.sendPing();
    }
    this.sendDelegateMessage("onPeerOpen", [this]);
    this.setReconnectAttemptCount(0);
  }

  onData (json) { // we set connection transmission format to JSON
    if (this.useMessageLog()) {
      const msg = RzMsg.clone().setContent(json)
      this.peerMsgs().addSubnode(msg)
    }

    if (json.name === "RzPeerConnPing") {
      this.onPing()
      return
    } 

    if (json.name === "RzPeerConnPong") {
      this.onPong()
      return
    }

    if (json.name === "RzPeerChunk") {
      this.onReceiveChunk(json)
      return
    }

    this.sendDelegateMessage("onPeerData", [this, json]);
  }

  clearChunks () {
    this.chunks().clear()
    return this
  }

  onReceiveChunk (chunk) {
    /*
      chunkJson format:
      {
        name: "RzPeerChunk",
        index: i, 
        total: total number of chunks,
        content: aString (part of JSON string)
      }
    */
    const chunks = this.chunks()

    //console.warn(this.type() + " onReceiveChunk() ", JSON.stringify(chunk));

    chunks.set(chunk.index, chunk.content);

    if (chunks.size === chunk.total) {
      // Reassemble the original message
      let s = "";
      for (let i = 0; i < chunk.total; i++) {
          s += chunks.get(i);
      }

      const json = JSON.parse(s);
      this.clearChunks()

      console.warn(this.type() + " completedChunks ", JSON.stringify(json));

      this.sendDelegateMessage("onPeerData", [this, json]);
    }
  }

  onError (error) {
    this.setError(error)
    this.debugLog("onError:", error);
    this.setStatus("error: " + error.message)

    this.sendDelegateMessage("onPeerError", [this, error]);

    const isDisconnect = this.disconnectErrorTypes().includes(error.type);
    if (isDisconnect) {
      this.onUnexpectedDisconnect()
    }
  }

  disconnectErrorTypes () {
    return [
      "network",
      "peer-unavailable",
      "disconnected",
      "server-error",
      "socket-error"
    ];
  }

  onClose () {
    this.debugLog("onClose");
    this.setStatus("closed")
    this.cancelNextPingTimeout()

    this.sigServerConn().removePeerConnection(this);
    this.setConn(null);

    this.sendDelegateMessage("onPeerClose", [this]);
  }

  onUnexpectedDisconnect () {
    if (this.shouldAutoReconnect() && this.didInitiateConnection()) {
      const count = this.reconnectAttemptCount();
      this.setReconnectAttemptCount(this.reconnectAttemptCount() + 1);
      const delaySeconds = Math.pow(2, count);
      this.addTimeout(() => { this.reconnect() }, delaySeconds * 1000);
      console.log(this.typeId() + " will attempt reconnect in " + delaySeconds + " seconds");

    }
  }

  reconnect () {
    console.log(this.typeId() + " attempting reconnect")
    this.connect()
  }

  onDocumentBeforeUnload (aNote) {
    console.log(this.typeId() + " onDocumentBeforeUnload shutdown")
    this.shutdown()
  }

  // --- delegate ---

  sendDelegateMessage (methodName, args = [this]) {
    const d = this.delegate();
    if (d) {
      const m = d[methodName];
      if (m) {
        this.debugLog("sending delegate message " + methodName);
        m.apply(d, args);
      } else {
        this.debugLog("delegate " + this.delegate().typeId() + " missing method " + methodName);
      }
    } else {
      this.debugLog("no delegate");
    }
  }

  // --- sending ---

  maxMessageSize () {
    const conn = this.conn();
    if (conn.peerConnection) {
      const maxSize = conn.peerConnection._sctp.maxMessageSize;
      return maxSize
    }
    // assume default?
    return 65536; // in bytes
  }

  send (json) {
    const conn = this.conn();

    if (!conn) {
      console.warn("attempt to send to closed connection ", this.peerId());
      return;
    }

    // chunk message if it's too big
    const data = JSON.stringify(json);
    const mSize = data.length;
    const maxSize = this.maxMessageSize()
    if (mSize > maxSize) {
      const s = this.type() + " send() message size of " + mSize + " exceeds max of " + maxSize;
      console.warn(s);
      this.sendDataAsChunks(data);
      return;
    }

    conn.send(json);
  }

  sendDataAsChunks (dataStr) {
    const wrapperSize = 1024; // safe guess
    const chunkSize = this.maxMessageSize() - wrapperSize;

    // Calculate the number of chunks
    const numChunks = Math.ceil(dataStr.length / chunkSize);

    for (let i = 0; i < numChunks; i++) {
        const chunk = {
          name: "RzPeerChunk",
          index: i,
          total: numChunks,
          content: dataStr.slice(i * chunkSize, (i + 1) * chunkSize)
        };
        //console.warn(this.type() + " sending chunk:" + JSON.stringify(chunk))
        this.conn().send(chunk);
    }
  }

  sendThenClose (json) {
    this.send(json);
    setTimeout(() => {
      this.shutdown();
    }, 500); // without delay, send doesn't occur
  }

  // --- shutdown ---

  shutdown () {
    console.warn(this.type() + " " + this.shortId() + " shutdown");
    if (this.conn()) { // only close connection if it's still up
      this.setStatus("shutdown")
      this.conn().close()
      this.sigServerConn().removePeerConnection(this);
      this.setConn(null);
    }
  }

  serverIsConnected () {
    if (this.sigServerConn()) {
      return this.sigServerConn().isConnected()
    }
    return false
  }

  connectActionInfo () {
    return {
      isEnabled: !this.isServerConn() && !this.isOpen() && this.serverIsConnected()
    }
  }

  shutdownActionInfo () {
    return {
      isEnabled: this.isOpen()
    }
  }

  // --- sending ping & receiving pong ---

  sendPing () {
    if (!this.nextPingTimeout()) {
      console.log(this.typeId() + " sendPing")
      this.setGotPong(false)
      this.send({ name: "RzPeerConnPing" })
      this.setupNextPingTimeout()
    } else {
      debugger
    }
  }

  onPong () {
    //console.log(this.typeId() + " onPong")
    this.setGotPong(true)
  }

  // --- ping timeout ---

  setupNextPingTimeout () {
    this.cancelNextPingTimeout()
    const po = setTimeout(() => { this.onPingTimeout() }, this.nextPingTimeoutMs());
    this.setNextPingTimeout(po);
  }

  cancelNextPingTimeout () {
    const po = this.nextPingTimeout()
    if (po) {
      clearTimeout(po)
      this.setNextPingTimeout(null)
    }
  }

  onPingTimeout () {
    this.setNextPingTimeout(null)
    if (this.gotPong()) {
      this.sendPing()
    } else {
      console.log(this.typeId() + " onPingTimeout shutdown")
      this.shutdown()
    }
  }

  // --- receiving ping & sending pong ---

  onPing () {
    //console.log(this.typeId() + " onPing")
    this.sendPong();
  }

  sendPong () {
    //console.log(this.typeId() + " sendPong")
    this.send({ name: "RzPeerConnPong" })
  }

}.initThisClass());
