"use strict";

/**
 * @module library.services.Peer.RzSigServers
 */

/**
 * @class RzSigServerPeers
 * @extends SvSummaryNode
 * @classdesc Represents a collection of RzSigServer peers.
 */
(class RzSigServerPeers extends SvSummaryNode {

    /**
   * Initializes the prototype slots for the RzSigServerPeers class.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {string} title - The title of the peers collection.
     * @category Configuration
     */
        this.setTitle("peers");
        /**
     * @member {boolean} shouldStore - Indicates whether the peers should be stored.
     * @category Configuration
     */
        this.setShouldStore(false);
        /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes should be stored.
     * @category Configuration
     */
        this.setShouldStoreSubnodes(false);
        //this.setSubnodeClasses([RzSigServer]);
        /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether subnodes can be added.
     * @category Configuration
     */
        this.setNodeCanAddSubnode(false);
        /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes can be reordered.
     * @category Configuration
     */
        this.setNodeCanReorderSubnodes(false);
        /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note is the subnode count.
     * @category Configuration
     */
        this.setNoteIsSubnodeCount(true);
    }

    /**
   * Sets the peer ID array and updates the subnodes accordingly.
   * @category Peer Management
   * @param {Array} peerIds - An array of peer IDs.
   * @returns {RzSigServerPeers} The updated RzSigServerPeers instance.
   */
    setPeerIdArray (peerIds) {
    /*
    const idSet = peerIds.asSet()
    const subnodesToRemove = this.subnodes().shallowCopy().filter(sn => !idSet.has(sn.peerId()))
    this.removeSubnodes(subnodesToRemove)
    */

        // TODO: switch to merge
        this.removeAllSubnodes();
        peerIds.sort();
        peerIds.forEach(peerId => {
            const rzPeer = RzPeer.clone().setPeerId(peerId);
            this.addSubnode(rzPeer);
        });
        return this;
    }

}.initThisClass());
