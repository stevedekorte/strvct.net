/** * @module library.services.SvProxyServers
 */

/** * @class SvProxyServers
 * @extends SvSummaryNode
 * @classdesc SvProxyServers class for managing proxy servers.
 *
 *
 * Example config:
 *
 * const config = {
 *   "isSecure": true,
 *   "subdomain": "",
 *   "domain": "proxy.example.com",
 *   "port": 80,
 *   "path": "/proxy",
 *   "parameterName": "proxyUrl"
 * }
 *
 * SvProxyServers.shared().defaultServer().setupForConfigDict(config);

 *
 *
 * Example use:
 *
 * const proxyUrl = SvProxyServers.shared().defaultServer().proxyUrlForUrl(targetUrl);
 
 
 */

/**

 */
(class SvProxyServers extends SvSummaryNode {

    /**
   * @static
   * @description Initializes the class and sets it as a singleton.
   * @category Initialization
   */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
   * @description Initializes the prototype slots for the SvProxyServers class.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes.
     * @category Configuration
     */
        this.setSubnodeClasses([SvProxyServer]);
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
            this.addSubnode(SvDefaultProxyServer.clone());
        }
    }

    /**
   * @description Returns the default proxy server.
   * @returns {SvProxyServer} The default proxy server.
   * @category Access
   */
    defaultServer () {
        return this.subnodes().first();
    }

}.initThisClass());
