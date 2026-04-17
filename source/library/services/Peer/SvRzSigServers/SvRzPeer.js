/**
 * @module library.services.Peer.SvRzSigServers
 */

/**
 * @class SvRzPeer
 * @extends SvStorableNode
 * @classdesc Represents a peer in the SvRzSigServers system.
 */
(class SvRzPeer extends SvStorableNode {

    /**
   * @description Initializes the prototype slots for the SvRzPeer class.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {string} peerId - The unique identifier for the peer.
     * @category Identification
     */
        {
            const slot = this.newSlot("peerId", "");
            slot.setInspectorPath("");
            slot.setLabel("peer id");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
        }

        this.setShouldStoreSubnodes(false);
    }

    /**
   * @description Initializes the SvRzPeer instance.
   * @returns {SvRzPeer} The initialized SvRzPeer instance.
   * @category Initialization
   */
    init () {
        super.init();
        this.setIsDebugging(false);
        this.setCanDelete(false);
        return this;
    }

    /**
   * @description Performs final initialization steps for the SvRzPeer instance.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setCanDelete(false);
    }

    /**
   * @description Gets the title of the peer, which is its peer ID.
   * @returns {string} The peer ID.
   * @category Identification
   */
    title () {
        return this.peerId();
    }

    /**
   * @description Gets the subtitle for the peer.
   * @returns {string} The subtitle "peer".
   * @category Identification
   */
    subtitle () {
        return "peer";
    }

    /**
   * @description Gets the server associated with this peer.
   * @returns {Object} The server object.
   * @category Relationships
   */
    server () {
        return this.parentNode().parentNode();
    }

}.initThisClass());
