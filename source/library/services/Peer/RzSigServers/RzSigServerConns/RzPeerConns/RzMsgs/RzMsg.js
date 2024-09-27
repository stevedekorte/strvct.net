"use strict";

/**
 * @module library.services.Peer.RzSigServers.RzSigServerConns.RzPeerConns.RzMsgs
 */

/**
 * @class RzMsg
 * @extends BMSummaryNode
 * @classdesc Represents a message in the RzMsg system.
 */
(class RzMsg extends BMSummaryNode {

  initPrototypeSlots () {

    /**
     * @member {string|null} id - The unique identifier for the message.
     */
    {
      const slot = this.newSlot("id", null);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      //slot.setSummaryFormat("value")
    }

    /**
     * @member {string|null} content - The content of the message.
     */
    {
      const slot = this.newSlot("content", null);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      //slot.setSummaryFormat("value")
    }

    /**
     * @member {string} status - The status of the message (e.g., "sent", "received").
     */
    {
      const slot = this.newSlot("status", ""); // sent, received
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

    /**
     * @member {null} sendAction - The action for sending the message.
     */
    {
      const slot = this.newSlot("sendAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Send")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("send");
    }
    
    /**
     * @member {null} peer - The peer associated with this message.
     */
    {
      const slot = this.newSlot("peer", null);
    }

    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true)
  }

  /**
   * @description Initializes the RzMsg instance.
   * @returns {RzMsg} The initialized RzMsg instance.
   */
  init() {
    super.init();
    this.setStatus("");
    this.setIsDebugging(true);
    return this;
  }

  /**
   * @description Gets the title of the message.
   * @returns {string} The title of the message.
   */
  title () {
    return this.id() ? this.id() : "no message id"
  }

  /**
   * @description Gets the subtitle of the message.
   * @returns {string} The status of the message.
   */
  subtitle () {
    return this.status()
  }

  // --- sending ---

  /**
   * @description Sends a JSON message.
   * @param {Object} json - The JSON object to send.
   */
  send (json) {
    if (!this.conn()) {
      console.warn("attempt to send to closed connection ", this.peerId());
      return;
    }
    this.conn().send(json);
  }

  /**
   * @description Sends a JSON message and then closes the connection.
   * @param {Object} json - The JSON object to send.
   */
  sendThenClose (json) {
    this.send(json);
    setTimeout(() => {
      this.shutdown();
    }, 500); // without delay, send doesn't occur
  }

  // --- helpers ---

  /**
   * @description Gets the peer messages.
   * @returns {Object} The peer messages object.
   */
  peerMessages () {
    return this.parentNode()
  }

  /**
   * @description Gets the peer connection.
   * @returns {Object} The peer connection object.
   */
  peerConn () {
    return this.peerMessages().peerConn()
  }

  /**
   * @description Checks if the peer is connected.
   * @returns {boolean} True if connected, false otherwise.
   */
  isConnected () {
    return this.peerConn().isConnected()
  }

  // --- sending ---

  /**
   * @description Sends the message content.
   */
  send () {
    this.peerConn().send(this.content()) // content should be valid JSON
    this.setStatus("sent")
  }

  /**
   * @description Gets the send action information.
   * @returns {Object} An object containing the enabled status of the send action.
   */
  sendActionInfo () {
    return {
      isEnabled: this.isConnected()
    }
  }

  // -- receiving ---

  /**
   * @description Handles the received message.
   */
  onReceived () {
    this.setStatus("received")
  }

}.initThisClass());