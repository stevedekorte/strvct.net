"use strict";

/**
 * @module library.services.Peer.RzSigServers.RzSigServerConns.RzPeerConns
 */

/**
 * @class RzPeerConns
 * @extends BMSummaryNode
 * @classdesc Represents connections to peers.
 */
(class RzPeerConns extends BMSummaryNode {
  /**
   * Initializes the prototype slots for the RzPeerConns class.

   * @description Sets up the initial configuration for the RzPeerConns instance.
   */
  initPrototypeSlots () {
    /**
     * @property {Array} subnodeClasses - The classes of subnodes for this instance.
     */
    this.setSubnodeClasses([RzPeerConn]);
    /**
     * @property {string} title - The title of this instance.
     */
    this.setTitle("connections to peers");
    /**
     * @property {boolean} shouldStore - Whether this instance should be stored.
     */
    this.setShouldStore(false);
    /**
     * @property {boolean} shouldStoreSubnodes - Whether subnodes of this instance should be stored.
     */
    this.setShouldStoreSubnodes(false);
    /**
     * @property {boolean} nodeCanAddSubnode - Whether this node can add subnodes.
     */
    this.setNodeCanAddSubnode(false);
    /**
     * @property {boolean} nodeCanReorderSubnodes - Whether this node can reorder subnodes.
     */
    this.setNodeCanReorderSubnodes(true);
    /**
     * @property {boolean} noteIsSubnodeCount - Whether the note is the subnode count.
     */
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * Performs final initialization of the instance.

   * @description Calls the superclass finalInit method and performs a sanity check.
   */
  finalInit() {
    super.finalInit()
    assert(this.subnodeCount() === 0); // sanity check
  }

  /**
   * Gets the sigServerConn of this instance.

   * @returns {Object} The parent node, which is assumed to be the sigServerConn.
   */
  sigServerConn () {
    return this.parentNode()
  }

  /**
   * Sets the peer connection class.

   * @param {Class} aClass - The class to set as the peer connection class.
   * @returns {RzPeerConns} This instance.
   */
  setPeerConClass (aClass) {
    // assert(aClass.isKindOf(RzPeerConn.thisClass()));
    this.setSubnodeClasses([aClass])
    return this
  }

  /**
   * Gets the peer connection class.

   * @returns {Class} The first (and only) subnode class.
   */
  peerConnClass () {
    return this.subnodeClasses().first()
  }

  /**
   * Adds a peer connection for the given ID if it doesn't already exist.

   * @param {string} id - The ID of the peer connection to add.
   * @returns {Object} The existing or newly created peer connection.
   */
  addIfAbsentPeerConnForId (id) {
    this.assertValidSubnodes()

    const match = this.subnodes().detect(sn => sn.peerId() === id)
    if (match) {
      return match
    }

    const pc = this.peerConnClass().clone().setPeerId(id).setSigServerConn(this.sigServerConn())
    this.addSubnode(pc)
    return pc
  }

  /**
   * Asserts that all subnodes are valid.

   * @private
   */
  assertValidSubnodes () {
    const invalidMatch = this.subnodes().detect(sn => sn.thisClass().type() !== this.peerConnClass().type())
    assert(!invalidMatch);
  }

  /**
   * Adds a subnode to this instance.

   * @param {Object} aSubnode - The subnode to add.
   * @returns {Object} The result of adding the subnode.
   */
  addSubnode (aSubnode) {
    this.assertValidSubnodes()
    const r = super.addSubnode(aSubnode)
    this.assertValidSubnodes()
    return r
  }

  /**
   * Disconnects all peer connections.

   * @returns {RzPeerConns} This instance.
   */
  disconnectAllPeers () {
    this.subnodes().forEach(sn => sn.disconnect())
    return this
  }

}.initThisClass());