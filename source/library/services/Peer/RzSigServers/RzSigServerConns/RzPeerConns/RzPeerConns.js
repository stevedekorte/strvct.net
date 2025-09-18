"use strict";

/**
 * @module library.services.Peer.RzSigServers.RzSigServerConns.RzPeerConns
 */

/**
 * @class RzPeerConns
 * @extends SvSummaryNode
 * @classdesc Represents connections to peers.
 */
(class RzPeerConns extends SvSummaryNode {
  /**
   * Initializes the prototype slots for the RzPeerConns class.

   * @description Sets up the initial configuration for the RzPeerConns instance.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes for this instance.
     * @category Configuration
     */
    this.setSubnodeClasses([RzPeerConn]);
    /**
     * @member {string} title - The title of this instance.
     * @category Configuration
     */
    this.setTitle("connections to peers");
    /**
     * @member {boolean} shouldStore - Whether this instance should be stored.
     * @category Configuration
     */
    this.setShouldStore(false);
    /**
     * @member {boolean} shouldStoreSubnodes - Whether subnodes of this instance should be stored.
     * @category Configuration
     */
    this.setShouldStoreSubnodes(false);
    /**
     * @member {boolean} nodeCanAddSubnode - Whether this node can add subnodes.
     * @category Configuration
     */
    this.setNodeCanAddSubnode(false);
    /**
     * @member {boolean} nodeCanReorderSubnodes - Whether this node can reorder subnodes.
     * @category Configuration
     */
    this.setNodeCanReorderSubnodes(true);
    /**
     * @member {boolean} noteIsSubnodeCount - Whether the note is the subnode count.
     * @category Configuration
     */
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * Performs final initialization of the instance.

   * @description Calls the superclass finalInit method and performs a sanity check.
   * @category Initialization
   */
  finalInit() {
    super.finalInit()
    assert(this.subnodeCount() === 0); // sanity check
  }

  /**
   * Gets the sigServerConn of this instance.

   * @returns {Object} The parent node, which is assumed to be the sigServerConn.
   * @category Accessor
   */
  sigServerConn () {
    return this.parentNode()
  }

  /**
   * Sets the peer connection class.

   * @param {Class} aClass - The class to set as the peer connection class.
   * @returns {RzPeerConns} This instance.
   * @category Configuration
   */
  setPeerConClass (aClass) {
    // assert(aClass.isKindOf(RzPeerConn.thisClass()));
    this.setSubnodeClasses([aClass])
    return this
  }

  /**
   * Gets the peer connection class.

   * @returns {Class} The first (and only) subnode class.
   * @category Accessor
   */
  peerConnClass () {
    return this.subnodeClasses().first()
  }

  /**
   * Adds a peer connection for the given ID if it doesn't already exist.

   * @param {string} id - The ID of the peer connection to add.
   * @returns {Object} The existing or newly created peer connection.
   * @category Management
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
   * @category Validation
   */
  assertValidSubnodes () {
    const invalidMatch = this.subnodes().detect(sn => sn.thisClass().svType() !== this.peerConnClass().svType())
    assert(!invalidMatch);
  }

  /**
   * Adds a subnode to this instance.

   * @param {Object} aSubnode - The subnode to add.
   * @returns {Object} The result of adding the subnode.
   * @category Management
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
   * @category Management
   */
  disconnectAllPeers () {
    this.subnodes().forEach(sn => sn.disconnect())
    return this
  }

}.initThisClass());