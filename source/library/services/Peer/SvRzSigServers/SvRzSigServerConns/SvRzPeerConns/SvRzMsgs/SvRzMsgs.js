"use strict";

/**
 * @module library.services.Peer.SvRzSigServers.SvRzSigServerConns.SvRzPeerConns.SvRzMsgs
 */

/**
 * @class SvRzMsgs
 * @extends SvSummaryNode
 * @classdesc Represents a collection of peer messages.
 */
(class SvRzMsgs extends SvSummaryNode {

    /**
   * Initializes the prototype slots for the SvRzMsgs class.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes for this SvRzMsgs instance.
     * @category Configuration
     */
        this.setSubnodeClasses([SvRzMsg]);

        /**
     * @member {string} title - The title of this SvRzMsgs instance.
     * @category Configuration
     */
        this.setTitle("peer messages");

        /**
     * @member {boolean} shouldStore - Indicates whether this SvRzMsgs instance should be stored.
     * @category Storage
     */
        this.setShouldStore(true);

        /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether the subnodes of this SvRzMsgs instance should be stored.
     * @category Storage
     */
        this.setShouldStoreSubnodes(true);

        /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether this SvRzMsgs instance can add subnodes.
     * @category Node Management
     */
        this.setNodeCanAddSubnode(true);

        /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether this SvRzMsgs instance can reorder subnodes.
     * @category Node Management
     */
        this.setNodeCanReorderSubnodes(true);

        /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note for this SvRzMsgs instance is the subnode count.
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
        return this.parentNode();
    }

}.initThisClass());
