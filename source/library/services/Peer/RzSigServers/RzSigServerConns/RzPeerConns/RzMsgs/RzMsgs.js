"use strict";

/**
 * @module library.services.Peer.RzSigServers.RzSigServerConns.RzPeerConns.RzMsgs
 */

/**
 * @class RzMsgs
 * @extends SvSummaryNode
 * @classdesc Represents a collection of peer messages.
 */
(class RzMsgs extends SvSummaryNode {
  
  /**
   * Initializes the prototype slots for the RzMsgs class.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes for this RzMsgs instance.
     * @category Configuration
     */
    this.setSubnodeClasses([RzMsg]);

    /**
     * @member {string} title - The title of this RzMsgs instance.
     * @category Configuration
     */
    this.setTitle("peer messages");

    /**
     * @member {boolean} shouldStore - Indicates whether this RzMsgs instance should be stored.
     * @category Storage
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether the subnodes of this RzMsgs instance should be stored.
     * @category Storage
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether this RzMsgs instance can add subnodes.
     * @category Node Management
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether this RzMsgs instance can reorder subnodes.
     * @category Node Management
     */
    this.setNodeCanReorderSubnodes(true);

    /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note for this RzMsgs instance is the subnode count.
     * @category Display
     */
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * Returns the parent node, which is the peer connection.
   * @category Node Navigation
   * @returns {Object} The peer connection object.
   */
  peerConn () {
    return this.parentNode()
  }

}.initThisClass());