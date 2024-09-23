/**
 * @module library.services.ProxyServers
 */

/**
 * @class ProxyServers
 * @extends BMSummaryNode
 * @classdesc ProxyServers class for managing proxy servers.
 * 
 * example use:
 * 
 * const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(targetUrl);
 */
(class ProxyServers extends BMSummaryNode {
      
  /**
   * @static
   * @description Initializes the class and sets it as a singleton.
   */
  static initClass () {
    this.setIsSingleton(true)
  }

  /**
   * @description Initializes the prototype slots for the ProxyServers class.
   */
  initPrototypeSlots () {
    /**
     * @property {Array} subnodeClasses - The classes of subnodes.
     */
    this.setSubnodeClasses([ProxyServer]);
    /**
     * @property {boolean} shouldStore - Whether the node should be stored.
     */
    this.setShouldStore(true);
    /**
     * @property {boolean} shouldStoreSubnodes - Whether subnodes should be stored.
     */
    this.setShouldStoreSubnodes(true);
    /**
     * @property {boolean} nodeCanAddSubnode - Whether the node can add subnodes.
     */
    this.setNodeCanAddSubnode(true);
    /**
     * @property {boolean} nodeCanReorderSubnodes - Whether subnodes can be reordered.
     */
    this.setNodeCanReorderSubnodes(true);
    /**
     * @property {boolean} noteIsSubnodeCount - Whether the note is the subnode count.
     */
    this.setNoteIsSubnodeCount(false);
    /**
     * @property {string} title - The title of the proxy servers.
     */
    this.setTitle("Proxies");
    /**
     * @property {string} subtitle - The subtitle of the proxy servers.
     */
    this.setSubtitle("web proxy servers");
  }

  /**
   * @description Performs final initialization and adds a default proxy if needed.
   */
  finalInit() {
    super.finalInit()
    this.addDefaultIfNeeded()
  }

  /**
   * @description Adds a default proxy server if there are no subnodes.
   */
  addDefaultIfNeeded () {
    if (this.subnodesCount() === 0) {
      this.addSubnode(DefaultProxyServer.clone())
    }
  }

  /**
   * @description Returns the default proxy server.
   * @returns {ProxyServer} The default proxy server.
   */
  defaultServer () {
    return this.subnodes().first()
  }

}.initThisClass());