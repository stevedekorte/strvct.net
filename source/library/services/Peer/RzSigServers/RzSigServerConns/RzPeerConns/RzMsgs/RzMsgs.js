"use strict";

/**
 * @module library.services.Peer.RzSigServers.RzSigServerConns.RzPeerConns.RzMsgs
 */

/**
 * @class RzMsgs
 * @extends BMSummaryNode
 * @classdesc Represents a collection of peer messages.
 */
(class RzMsgs extends BMSummaryNode {
  
  /**
   * Initializes the prototype slots for the RzMsgs class.

   */
  initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes for this RzMsgs instance.
     */
    this.setSubnodeClasses([RzMsg]);

    /**
     * @member {string} title - The title of this RzMsgs instance.
     */
    this.setTitle("peer messages");

    /**
     * @member {boolean} shouldStore - Indicates whether this RzMsgs instance should be stored.
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether the subnodes of this RzMsgs instance should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether this RzMsgs instance can add subnodes.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether this RzMsgs instance can reorder subnodes.
     */
    this.setNodeCanReorderSubnodes(true);

    /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note for this RzMsgs instance is the subnode count.
     */
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * Returns the parent node, which is the peer connection.

   * @returns {Object} The peer connection object.
   */
  peerConn () {
    return this.parentNode()
  }

}.initThisClass());