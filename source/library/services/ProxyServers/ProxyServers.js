/**
 * @module library.services.ProxyServers
 * @class ProxyServers
 * @extends SvSummaryNode
 * @classdesc ProxyServers class for managing proxy servers.
 *
 * example use:
 *
 * const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(targetUrl);
 */
(class ProxyServers extends SvSummaryNode {

    /**
   * @static
   * @description Initializes the class and sets it as a singleton.
   * @category Initialization
   */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
   * @description Initializes the prototype slots for the ProxyServers class.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes.
     * @category Configuration
     */
        this.setSubnodeClasses([ProxyServer]);
        /**
     * @member {boolean} shouldStore - Whether the node should be stored.
     * @category Configuration
     */
        this.setShouldStore(true);
        /**
     * @member {boolean} shouldStoreSubnodes - Whether subnodes should be stored.
     * @category Configuration
     */
        this.setShouldStoreSubnodes(true);
        /**
     * @member {boolean} nodeCanAddSubnode - Whether the node can add subnodes.
     * @category Configuration
     */
        this.setNodeCanAddSubnode(true);
        /**
     * @member {boolean} nodeCanReorderSubnodes - Whether subnodes can be reordered.
     * @category Configuration
     */
        this.setNodeCanReorderSubnodes(true);
        /**
     * @member {boolean} noteIsSubnodeCount - Whether the note is the subnode count.
     * @category Configuration
     */
        this.setNoteIsSubnodeCount(false);
        /**
     * @member {string} title - The title of the proxy servers.
     * @category Display
     */
        this.setTitle("Proxies");
        /**
     * @member {string} subtitle - The subtitle of the proxy servers.
     * @category Display
     */
        this.setSubtitle("web proxy servers");
    }

    /**
   * @description Performs final initialization and adds a default proxy if needed.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.addDefaultIfNeeded();
    }

    /**
   * @description Adds a default proxy server if there are no subnodes.
   * @category Management
   */
    addDefaultIfNeeded () {
        if (this.subnodesCount() === 0) {
            this.addSubnode(DefaultProxyServer.clone());
        }
    }

    /**
   * @description Returns the default proxy server.
   * @returns {ProxyServer} The default proxy server.
   * @category Access
   */
    defaultServer () {
        return this.subnodes().first();
    }

}.initThisClass());
