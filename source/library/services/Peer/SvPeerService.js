/**
 * @module library.services.Peer
 */

/**
 * @class SvPeerService
 * @extends SvSummaryNode
 * @classdesc SvPeerService for WebRTC peer-to-peer networking
 */
(class SvPeerService extends SvSummaryNode {

    /**
   * @static
   * @description Initializes the class and sets it as a singleton
   * @category Initialization
   */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
   * @description Initializes the prototype slots for the SvPeerService
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {SvRzSigServers} servers
     * @description Servers slot for SvPeerService
     * @category Configuration
     */
        {
            const slot = this.newSlot("servers", null);
            slot.setFinalInitProto(SvRzSigServers);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
            slot.setSlotType("SvRzSigServers");
        }

        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    /**
   * @description Initializes the SvPeerService
   * @category Initialization
   */
    init () {
        super.init();
    }

    /**
   * @description Performs final initialization of the SvPeerService
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
