/**
 * @module library.services.Peer
 */

/**
 * @class PeerService
 * @extends SvSummaryNode
 * @classdesc PeerService for WebRTC peer-to-peer networking
 */
(class PeerService extends SvSummaryNode {

    /**
   * @static
   * @description Initializes the class and sets it as a singleton
   * @category Initialization
   */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
   * @description Initializes the prototype slots for the PeerService
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {RzSigServers} servers
     * @description Servers slot for PeerService
     * @category Configuration
     */
        {
            const slot = this.newSlot("servers", null);
            slot.setFinalInitProto(RzSigServers);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
            slot.setSlotType("RzSigServers");
        }

        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    /**
   * @description Initializes the PeerService
   * @category Initialization
   */
    init () {
        super.init();
    }

    /**
   * @description Performs final initialization of the PeerService
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle("WebRTC");
        this.setSubtitle("peer-to-peer networking");
    }

    /**
   * @description Returns the default signal server
   * @returns {Object} The first subnode of the servers
   * @category Server Management
   */
    defaultSignalServer () {
        return this.servers().subnodes().first();
    }

}.initThisClass());
