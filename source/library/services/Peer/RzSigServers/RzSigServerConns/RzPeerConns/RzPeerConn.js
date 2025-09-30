/**
 * @module library.services.Peer.RzSigServers.RzSigServerConns.RzPeerConns
 */

"use strict";

/**
 * @class RzPeerConn
 * @extends SvSummaryNode
 * @classdesc Wrapper for PeerJS DataConnection.
 *
 * Delegate messages:
 *
 * - onPeerOpen (peerConn)
 * - onPeerClose (peerConn)
 * - onPeerData (peerConn, data)
 * - onPeerError (peerConn)
 */
(class RzPeerConn extends SvSummaryNode {

    /**
   * @description Returns the default connection options.
   * @returns {Object} The default connection options.
   */
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
        };
    }

    /**
   * @description Initializes the prototype slots for the RzPeerConn class.
   */
    initPrototypeSlots () {
        {
            /**
       * @member {string} peerId
       */
            const slot = this.newSlot("peerId", null);
            slot.setInspectorPath("");
            //slot.setLabel("prompt")
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            //slot.setSummaryFormat("value")
        }

        {
            /**
       * @member {Object} connOptions
       */
            const slot = this.newSlot("connOptions", null);
            slot.setInspectorPath("");
            //slot.setLabel("connection options");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("JSON Object");
        }


        {
            /**
       * @member {string} status
       */
            const slot = this.newSlot("status", "");
            slot.setInspectorPath("");
            //slot.setLabel("prompt");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            //slot.setSummaryFormat("value");
        }

        // --- error and reconnect ---

        {
            /**
       * @member {Error} error
       */
            const slot = this.newSlot("error", null);
            slot.setShouldStoreSlot(false);
            slot.setCanEditInspection(false);
            slot.setSlotType("Error");
        }

        {
            /**
       * @member {boolean} didInitiateConnection
       */
            const slot = this.newSlot("didInitiateConnection", false); // if we initiated, it's up to us to try to reconnect
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("Boolean");
            slot.setCanEditInspection(false);
        }

        {
            /**
       * @member {boolean} shouldAutoReconnect
       */
            const slot = this.newSlot("shouldAutoReconnect", true); // (if didInitiateConnection is also true)
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
        }

        {
            /**
       * @member {number} reconnectAttemptCount
       */
            const slot = this.newSlot("reconnectAttemptCount", 0);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
        }

        // -------------------------

        {
            /**
       * @member {RzMsgs} peerMsgs
       */
            const slot = this.newSlot("peerMsgs", null);
            slot.setFinalInitProto(RzMsgs);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
            slot.setSlotType("RzMsgs");
        }

        {
            /**
       * @member {Action} shutdownAction
       */
            const slot = this.newSlot("shutdownAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Shutdown");
            //slot.setShouldStoreSlot(true)
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("shutdown");
        }


        {
            /**
       * @member {Action} connectAction
       */
            const slot = this.newSlot("connectAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Connect");
            //slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("connect");
        }

        {
            /**
       * @member {RzSigServerConn} sigServerConn
       */
            const slot = this.newSlot("sigServerConn", null);
            slot.setSlotType("RzSigServerConn");
        }

        {
            /**
       * @member {DataConnection} conn
       */
            const slot = this.newSlot("conn", null);
            slot.setSlotType("DataConnection");
        }

        {
            /**
       * @member {Object} info
       */
            const slot = this.newSlot("info", null);
            slot.setSlotType("JSON Object");
        }

        {
            /**
       * @member {Object} delegate
       */
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }


        {
            /**
       * @member {boolean} useMessageLog
       */
            const slot = this.newSlot("useMessageLog", false);
            slot.setSlotType("Boolean");
        }

        // --- ping pong keepalive ---

        {
            /**
       * @member {boolean} useKeepAlive
       */
            const slot = this.newSlot("useKeepAlive", false);
            slot.setSlotType("Boolean");
        }

        {
            /**
       * @member {number} nextPingTimeout
       */
            const slot = this.newSlot("nextPingTimeout", null);
            slot.setSlotType("Number");
        }

        {
            /**
       * @member {boolean} gotPong
       */
            const slot = this.newSlot("gotPong", false);
            slot.setSlotType("Boolean");
        }

        {
            /**
       * @member {number} nextPingTimeoutMs
       */
            const slot = this.newSlot("nextPingTimeoutMs", 30 * 1000);
            slot.setSlotType("Number");
        }

        // --- msg chunking --

        {
            /**
       * @member {Map} chunks
       */
            const slot = this.newSlot("chunks", null);
            slot.setSlotType("Map");
        }


        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
    }

    /**
   * @description Returns the id of the peer connection.
   * @returns {string|null} The peer id or null if not connected.
   */
    id () {
        const conn = this.conn();
        if (conn) {
            return conn.peer;
        }
        return null;
    }

    /**
   * @description Returns a shortened version of the peer id.
   * @returns {string} The shortened peer id.
   */
    shortId () {
        const id = this.id();
        return id ? this.id().slice(0, 5) + "..." : "null";
    }

    /**
   * @description Returns a debug-friendly type and id string.
   * @returns {string} The debug type and id.
   */
    svDebugId () {
        return this.svType() + " " + this.shortId();
    }

    /**
   * @description Initializes the RzPeerConn instance.
   * @returns {RzPeerConn} The initialized instance.
   */
    init () {
        super.init();
        this.setStatus("offline");
        this.setIsDebugging(false);
        this.setConnOptions(this.connOptionsDefault());
        this.setChunks(new Map());
        return this;
    }

    /**
   * @description Returns the title of the peer connection.
   * @returns {string} The peer id.
   */
    title () {
        return this.peerId();
    }

    /**
   * @description Returns the subtitle of the peer connection.
   * @returns {string} The subtitle.
   */
    subtitle () {
        if (this.isServerConn()) {
            return "ourself";
        }

        return this.status();
    }

    /**
   * @description Sets the connection and initializes it.
   * @param {DataConnection} conn - The peer connection.
   * @returns {RzPeerConn} The current instance.
   */
    setConn (conn) {
        this._conn = conn;
        if (conn) {
            this.setPeerId(conn.peer);
            this.setupConn();
            this.watchOnceForNote("onDocumentBeforeUnload");
        }
        return this;
    }

    /**
   * @description Sets up the connection event listeners.
   */
    setupConn  () {
        const conn = this.conn();
        conn.on("data", (data) => this.onData(data));
        conn.on("open", () => this.onOpen());
        conn.on("close", () => this.onClose());
        conn.on("error", (error) => this.onError(error));
        this.setStatus("connected to peer");
    }

    /**
   * @description Checks if this is a server connection.
   * @returns {boolean} True if it's a server connection, false otherwise.
   */
    isServerConn () {
        if (this.sigServerConn()) {
            return this.peerId() === this.sigServerConn().peerId();
        }
        return false;
    }

    /**
   * @description Checks if the connection is established.
   * @returns {boolean} True if connected, false otherwise.
   */
    isConnected () {
        const isConnected = this.isOpen();
        assert(Type.isBoolean(isConnected));
        return isConnected;
    }

    /**
   * @description Checks if the connection is open.
   * @returns {boolean} True if open, false otherwise.
   */
    isOpen () {
        return !Type.isNullOrUndefined(this.conn()) && this.conn().open;
    }

    // --- connection options ---

    // --- label ---

    /**
   * @description Sets the connection label.
   * @param {string} s - The label to set.
   * @returns {RzPeerConn} The current instance.
   */
    setConnLabel (s) {
    // the label we pass when we initiate a connection
        this.connOptions().label = s;
        return this;
    }

    /**
   * @description Gets the connection label.
   * @returns {string} The connection label.
   */
    connLabel () {
    // the label we pass when we initiate a connection
        return this.connOptions().label;
    }

    /**
   * @description Gets the peer label.
   * @returns {string} The peer label.
   */
    peerLabel () {
    // the label we receive when we accept a connection
        return this.conn().label;
    }

    // --- metadata ---

    /**
   * @description Gets the local metadata.
   * @returns {Object} The local metadata.
   */
    localMetadata () {
    // metadata we'll share with peer when we connect
        return this.connOptions().metadata;
    }

    /**
   * @description Gets the remote metadata.
   * @returns {Object|null} The remote metadata or null if not connected.
   */
    remoteMetadata () {
    // metadata the peer shared with us when we connected
        if (this.conn()) {
            return this.conn().metadata;
        }
        return null;
    }

    // --------------------------------

    /**
   * @description Initiates a connection to the peer.
   * @returns {RzPeerConn} The current instance.
   */
    connect () {
        this.setDidInitiateConnection(true);
        if (this.isServerConn()) {
            this.setStatus("can't connect to our own peer id");
            return this;
        }

        const peer = this.sigServerConn().peer();
        if (peer) {
            const conn = peer.connect(this.peerId(), this.connOptions());
            this.setConn(conn);
            this.setDidInitiateConnection(true);
        } else {
            this.setStatus("can't connect to peer when server connection is offline");
        }
    }

    // --- events ---

    /**
   * @description Handles the open event of the connection.
   */
    onOpen () {
        this.logDebug("onOpen");
        this.clearChunks();
        if (this.useKeepAlive()) {
            this.sendPing();
        }
        this.sendDelegateMessage("onPeerOpen", [this]);
        this.setReconnectAttemptCount(0);
    }

    /**
   * @description Handles incoming data from the peer.
   * @param {Object} json - The received JSON data.
   */
    onData (json) { // we set connection transmission format to JSON
        if (this.useMessageLog()) {
            const msg = RzMsg.clone().setContent(json);
            this.peerMsgs().addSubnode(msg);
        }

        if (json.name === "RzPeerConnPing") {
            this.onPing();
            return;
        }

        if (json.name === "RzPeerConnPong") {
            this.onPong();
            return;
        }

        if (json.name === "RzPeerChunk") {
            this.onReceiveChunk(json);
            return;
        }

        this.sendDelegateMessage("onPeerData", [this, json]);
    }

    /**
   * @description Clears all stored chunks.
   * @returns {RzPeerConn} The current instance.
   */
    clearChunks () {
        this.chunks().clear();
        return this;
    }

    /**
   * @description Handles receiving a chunk of data.
   * @param {Object} chunk - The received chunk.
   */

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
        const chunks = this.chunks();

        //console.warn(this.svType() + " onReceiveChunk() ", JSON.stringify(chunk));

        chunks.set(chunk.index, chunk.content);

        if (chunks.size === chunk.total) {
            // Reassemble the original message
            let s = "";
            for (let i = 0; i < chunk.total; i++) {
                s += chunks.get(i);
            }

            const json = JSON.parse(s);
            this.clearChunks();

            //this.logDebug(this.svType() + " completedChunks ", JSON.stringify(json));

            this.sendDelegateMessage("onPeerData", [this, json]);
        }
    }

    /**
   * @description Handles the error event of the connection.
   * @param {Error} error - The error object.
   */
    onError (error) {
        this.setError(error);
        this.logDebug("onError:", error);
        this.setStatus("error: " + error.message);

        this.sendDelegateMessage("onPeerError", [this, error]);

        const isDisconnect = this.disconnectErrorTypes().includes(error.type);
        if (isDisconnect) {
            this.onUnexpectedDisconnect();
        }
    }

    /**
   * @description Returns the types of errors that indicate a disconnect.
   * @returns {Array} The types of disconnect errors.
   */
    disconnectErrorTypes () {
        return [
            "network",
            "peer-unavailable",
            "disconnected",
            "server-error",
            "socket-error"
        ];
    }

    /**
   * @description Handles the close event of the connection.
   */
    onClose () {
        this.logDebug("onClose");
        this.setStatus("closed");
        this.cancelNextPingTimeout();

        this.sigServerConn().removePeerConnection(this);
        this.setConn(null);

        this.sendDelegateMessage("onPeerClose", [this]);
    }

    /**
   * @description Handles an unexpected disconnect.
   */
    onUnexpectedDisconnect () {
        if (this.shouldAutoReconnect() && this.didInitiateConnection()) {
            const count = this.reconnectAttemptCount();
            this.setReconnectAttemptCount(this.reconnectAttemptCount() + 1);
            const delaySeconds = Math.pow(2, count);
            this.addTimeout(() => { this.reconnect(); }, delaySeconds * 1000);
            console.log(this.svTypeId() + " will attempt reconnect in " + delaySeconds + " seconds");

        }
    }

    /**
   * @description Attempts to reconnect to the peer.
   */
    reconnect () {
        console.log(this.svTypeId() + " attempting reconnect");
        this.connect();
    }

    /**
   * @description Handles the document before unload event.
   * @param {Event} aNote - The event object.
   */
    onDocumentBeforeUnload (/*aNote*/) {
        console.log(this.svTypeId() + " onDocumentBeforeUnload shutdown");
        this.shutdown();
    }

    // --- delegate ---

    /**
   * @description Sends a delegate message.
   * @param {string} methodName - The method name to call.
   * @param {Array} args - The arguments to pass to the method.
   */
    sendDelegateMessage (methodName, args = [this]) {
        const d = this.delegate();
        if (d) {
            const m = d[methodName];
            if (m) {
                this.logDebug("sending delegate message " + methodName);
                m.apply(d, args);
            } else {
                this.logDebug("delegate " + this.delegate().svTypeId() + " missing method " + methodName);
            }
        } else {
            this.logDebug("no delegate");
        }
    }

    // --- sending ---

    /**
   * @description Returns the maximum message size for the connection.
   * @returns {number} The maximum message size in bytes.
   */
    maxMessageSize () {
        const conn = this.conn();
        if (conn.peerConnection) {
            const maxSize = conn.peerConnection._sctp.maxMessageSize;
            return maxSize;
        }
        // assume default?
        return 65536; // in bytes
    }

    /**
   * @description Sends a JSON message to the peer.
   * @param {Object} json - The JSON object to send.
   */
    send (json) {
        const conn = this.conn();

        if (!conn) {
            console.warn("attempt to send to closed connection ", this.peerId());
            return;
        }

        // chunk message if it's too big
        const data = JSON.stringify(json);
        const mSize = data.length;
        const maxSize = this.maxMessageSize();
        if (mSize > maxSize) {
            const s = this.svType() + " send() message size of " + mSize + " exceeds max of " + maxSize;
            console.warn(s);
            this.sendDataAsChunks(data);
            return;
        }

        conn.send(json);
    }

    /**
   * @description Sends data as chunks if the message size exceeds the maximum.
   * @param {string} dataStr - The data string to send.
   */
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
            //console.warn(this.svType() + " sending chunk:" + JSON.stringify(chunk))
            this.conn().send(chunk);
        }
    }

    /**
   * @description Sends a JSON message and then closes the connection.
   * @param {Object} json - The JSON object to send.
   */
    sendThenClose (json) {
        this.send(json);
        this.addTimeout(() => {
            this.shutdown();
        }, 500); // without delay, send doesn't occur
    }

    // --- shutdown ---

    /**
   * @description Disconnects the connection.
   */
    disconnect () {
        this.shutdown();
    }

    /**
   * @description Shuts down the connection.
   */
    shutdown () {
        console.warn(this.svType() + " " + this.shortId() + " shutdown");
        if (this.conn()) { // only close connection if it's still up
            this.setStatus("shutdown");
            this.conn().close();
            this.sigServerConn().removePeerConnection(this);
            this.setConn(null);
        }
    }

    /**
   * @description Checks if the server connection is connected.
   * @returns {boolean} True if connected, false otherwise.
   */
    serverIsConnected () {
        if (this.sigServerConn()) {
            return this.sigServerConn().isConnected();
        }
        return false;
    }

    /**
   * @description Returns the connection action information.
   * @returns {Object} The connection action information.
   */
    connectActionInfo () {
        return {
            isEnabled: !this.isServerConn() && !this.isOpen() && this.serverIsConnected()
        };
    }

    /**
   * @description Returns the shutdown action information.
   * @returns {Object} The shutdown action information.
   */
    shutdownActionInfo () {
        return {
            isEnabled: this.isOpen()
        };
    }

    // --- sending ping & receiving pong ---

    /**
   * @description Sends a ping to the peer.
   */
    sendPing () {
        if (!this.nextPingTimeout()) {
            console.log(this.svTypeId() + " sendPing");
            this.setGotPong(false);
            this.send({ name: "RzPeerConnPing" });
            this.setupNextPingTimeout();
        } else {
            // no-op
        }
    }

    /**
   * @description Handles the pong event.
   */
    onPong () {
    //console.log(this.svTypeId() + " onPong")
        this.setGotPong(true);
    }

    // --- ping timeout ---

    /**
   * @description Sets up the next ping timeout.
   */
    setupNextPingTimeout () {
        this.cancelNextPingTimeout();
        const po = this.addTimeout(() => { this.onPingTimeout(); }, this.nextPingTimeoutMs());
        this.setNextPingTimeout(po);
    }

    /**
   * @description Cancels the next ping timeout.
   */
    cancelNextPingTimeout () {
        const po = this.nextPingTimeout();
        if (po) {
            clearTimeout(po);
            this.setNextPingTimeout(null);
        }
    }

    /**
   * @description Handles the ping timeout event.
   */
    onPingTimeout () {
        this.setNextPingTimeout(null);
        if (this.gotPong()) {
            this.sendPing();
        } else {
            console.log(this.svTypeId() + " onPingTimeout shutdown");
            this.shutdown();
        }
    }

    // --- receiving ping & sending pong ---

    /**
   * @description Handles the ping event.
   */
    onPing () {
    //console.log(this.svTypeId() + " onPing")
        this.sendPong();
    }

    /**
   * @description Sends a pong to the peer.
   */
    sendPong () {
    //console.log(this.svTypeId() + " sendPong")
        this.send({ name: "RzPeerConnPong" });
    }

}.initThisClass());
