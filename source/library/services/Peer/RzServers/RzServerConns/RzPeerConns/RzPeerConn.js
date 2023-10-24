"use strict";

/* 
    RzPeerConn


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
    this.sendDelegateMessage("onPeerOpen");
  }

  onData (data) {
    const msg = RzMsg.clone().setContent(data)
    this.peerMsgs().addSubnode(msg)
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

    this.serverConn().removePeerConnection(this);
    this.setConn(null);

    this.sendDelegateMessage("onPeerClose");
  }

  // --- delegate ---

  sendDelegateMessage (methodName, args = [this]) {
    const d = this.delegate();
    if (d) {
      const m = d[methodName];
      if (m) {
        m.apply(d, args);
      }
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

}.initThisClass());
