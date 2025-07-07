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
   * @category Initialization
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the instance.
   * @category Initialization
   */
  init() {
    super.init();
  }

  /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
  finalInit() {
    super.finalInit()
    this.setTitle("Default Proxy Server");
    this.setParameterName("proxyUrl");
    this.setupForPage()
  }

  /**
   * @description Sets up the proxy server based on the current page's location.
   * @category Configuration
   */
  setupForPage () {
    if (SvPlatform.isNodePlatform()) {
      return;
    } else {
      const loc = window.location;  
      this.setHostname(loc.hostname);
      this.setPort(Number(loc.port));
      this.setIsSecure(loc.protocol === "https:");
    }
  }

  /*
  getWindowLocationURL () {
    if (window) {
      return new URL(window.location.href);
    } else {
      return null;
    }
  }
  */

}.initThisClass());