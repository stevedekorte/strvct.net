"use strict";

/**
 * @module library.services.ProxyServers
 */

/**
 * @class DefaultProxyServer
 * @extends ProxyServer
 * @classdesc ProxyServer implementation for default proxy settings.
 */
(class DefaultProxyServer extends ProxyServer {
  
  /**
   * @description Initializes prototype slots for the class.
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the instance.
   */
  init() {
    super.init();
  }

  /**
   * @description Performs final initialization steps.
   */
  finalInit() {
    super.finalInit()
    this.setTitle("Default Proxy Server");
    this.setParameterName("proxyUrl");
    this.setupForPage()
  }

  /**
   * @description Sets up the proxy server based on the current page's location.
   */
  setupForPage () {
    this.setHostname(window.location.hostname);
    this.setPort(window.location.port);
    this.setIsSecure(window.location.protocol === "https:");
  }

}.initThisClass());