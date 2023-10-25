"use strict";

/* 
    RzPeerConn

    Wrapper for PeerJS DataConnection.

    TODO: add isOpen slot?
    
*/

(class RzPeerConn extends BMSummaryNode {

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
      const slot = this.newSlot("serverConn", null);
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
      const slot = this.newSlot("nextPingTimeout", null);
    }

    {
      const slot = this.newSlot("gotPong", false);
    }

    {
      const slot = this.newSlot("nextPingTimeoutMs", 10000);
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
    if (this.serverConn()) {
      return this.peerId() === this.serverConn().peerId()
    }
    return false
  }

  isConnected () {
    return this.conn() !== null
  }

  connect () {
    if (this.isServerConn()) {
      this.setStatus("can't connect to our own peer id")
      return this
    }

    const peer = this.serverConn().peer();
    if (peer) {
      const conn = peer.connect(this.peerId());
      this.setConn(conn)
    } else {
      this.setStatus("can't connect to peer when server connection is offline")
    }
  }

  // --- events ---

  onOpen () {
    this.debugLog("onOpen");
    this.sendPing()
    this.sendDelegateMessage("onPeerOpen");
  }

  onData (data) {
    // data in JSON format?
    if (this.useMessageLog()) {
      const msg = RzMsg.clone().setContent(data)
      this.peerMsgs().addSubnode(msg)
    }

    if (data.name === "RzPeerConnPing") {
      this.onPing()
      return
    } 

    if (data.name === "RzPeerConnPong") {
      this.onPong()
      return
    }

    this.sendDelegateMessage("onPeerData", [data]);
  }

  onError (error) {
    this.debugLog("onError:", error);
    this.setStatus("error: " + error.message)

    this.sendDelegateMessage("onPeerError", [error]);
  }

  onClose () {
    this.debugLog("onClose");
    this.setStatus("closed")
    this.cancelNextPingTimeout()

    this.serverConn().removePeerConnection(this);
    this.setConn(null);

    this.sendDelegateMessage("onPeerClose");
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

  send (json) {
    if (!this.conn()) {
      console.warn("attempt to send to closed connection ", this.peerId());
      return;
    }
    this.conn().send(json);
  }

  sendThenClose (json) {
    this.send(json);
    setTimeout(() => {
      this.shutdown();
    }, 500); // without delay, send doesn't occur
  }

  // --- shutdown ---

  shutdown () {
    console.log(this.type() + " " + this.shortId() + " shutdown");
    if (this.conn()) { // only close connection if it's still up
      this.setStatus("shutdown")
      this.conn().close()
      this.serverConn().removePeerConnection(this);
      this.setConn(null);
    }
  }

  serverIsConnected () {
    if (this.serverConn()) {
      return this.serverConn().isConnected()
    }
    return false
  }

  connectActionInfo () {
    return {
      isEnabled: !this.isServerConn() && !this.isConnected() && this.serverIsConnected()
    }
  }

  shutdownActionInfo () {
    return {
      isEnabled: this.isConnected()
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
    console.log(this.typeId() + " onPong")
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
    console.log(this.typeId() + " onPing")
    this.sendPong();
  }

  sendPong () {
    console.log(this.typeId() + " sendPong")
    this.send({ name: "RzPeerConnPong" })
  }

}.initThisClass());
