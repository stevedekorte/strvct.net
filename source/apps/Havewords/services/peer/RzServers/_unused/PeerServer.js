"use strict";

/* 
    PeerServer

*/

(class PeerServer extends Base {
  initPrototypeSlots() {
    this.newSlot("peerId", null);
    this.newSlot("peer", null);
    this.newSlot("retryCount", 0);
    this.newSlot("maxRetries", 5);
    this.newSlot("peerConnectionClass", PeerConnection);
    this.newSlot("peerConnections", null);
    this.newSlot("allowsIncomingConnections", true);
    this.newSlot("delegate", true);
  }

  init() {
    super.init();
    this.setPeerConnections(new Map());
    this.setIsDebugging(false)
    return this
  }

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

  localPeerOptions () {
    return {
        host: "localhost",
        port: 9000,
        path: "/myapp",
      }
  }

  setup() {
    //console.log("getPeers: ", await this.getPeers());

    //const id = LocalUser.shared().id();
    //this.debugLog("connecting to peerjs as:" + LocalUser.shared().shortId())
    this.debugLog("connecting to peerjs")
    const peer = new Peer(undefined, this.peerOptions());

    /*
    peer.__peerData = {
      // Your data here
    };
    */

    this.setPeer(peer);

    peer.on("open", (id) => this.onOpen(id) );
    peer.on("error", (error) => this.onError(error) );
    peer.on("call", (call) => this.onCall(call) );
    peer.on("connection", (conn) => this.onConnection(conn) )
    return this;
  }

  async onOpen(peerId) {
    this.setPeerId(peerId)
    this.debugLog("open with peerId: '" + peerId + "'");
    this.delegate().onPeerServerOpen()
  }
  
  addPeerConnection(pc) {
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

    if (this.retryCount() < this.maxRetries()) {
      setTimeout(() => {
        console.warn("Attempting to reconnect to PeerJS server... (attempt #" + this.retryCount() + ")");
        this.peer().reconnect(); // TODO: will this call onConnection again?
        this.setRetryCount(this.retryCount() + 1);
      }, 5000);
    } else {
      console.warn(
        this.type() +
          "Reached maximum number of " + this.maxRetries() + " retries. Displaying system message."
      );
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

  connectToPeerId(peerId) {
    const conn = this.peer().connect(peerId);
    const pc = PeerConnection.clone().setConn(conn)
    this.addPeerConnection(pc);
    return pc
  }

  broadcast(json) {
    this.peerConnections().forEachKV((id, peerConnection) => {
      peerConnection.send(json)
    });
  }

  broadcastExceptTo(json, excludeId) {
    this.peerConnections().forEachKV((guestId, peerConnection) => {
        if (peerConnection.peerId() !== excludeId) {
          peerConnection.send(json);
        }
      });
  }

  peerConnectionForId (id) {
    return this.peerConnections().get(id)
  }

  shutdown () {
    this.peerConnections().valuesArray().forEach((conn) => {
      conn.shutdown();
    });
    return this;
  }

  getPeersUrl () {
    const opts = this.peerOptions();
    return "https://" + opts.host + opts.path + '/api/peers';
  }

  async getPeers() { // Note this is a GET request, so we don't need to be connected to do this
    const url = this.getPeersUrl();
    console.log("getPeersUrl: '" + url + "'");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const peers = await response.json();
    return peers;
  }

}.initThisClass());
