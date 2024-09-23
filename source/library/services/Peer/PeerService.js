/**
 * @module library.services.Peer
 */

/**
 * @class PeerService
 * @extends BMSummaryNode
 * @classdesc PeerService for WebRTC peer-to-peer networking
 */
(class PeerService extends BMSummaryNode {
  
  /**
   * @static
   * @description Initializes the class and sets it as a singleton
   */
  static initClass () {
    this.setIsSingleton(true)
  }

  /**
   * @description Initializes the prototype slots for the PeerService
   */
  initPrototypeSlots () {

    /**
     * @property {RzSigServers} servers
     * @description Servers slot for PeerService
     */
    {
      const slot = this.newSlot("servers", null)
      slot.setFinalInitProto(RzSigServers)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("RzSigServers");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the PeerService
   */
  init () {
    super.init();
  }

  /**
   * @description Performs final initialization of the PeerService
   */
  finalInit () {
    super.finalInit()
    this.setTitle("WebRTC");
    this.setSubtitle("peer-to-peer networking");
  }

  /**
   * @description Returns the default signal server
   * @returns {Object} The first subnode of the servers
   */
  defaultSignalServer () {
    return this.servers().subnodes().first();
  }

}.initThisClass());