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
  init () {
    super.init();
  }

  /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
  finalInit () {
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
    }
    
    // Use centralized environment configuration
    // Note: UoEnvironment may not be loaded yet when DefaultProxyServer is initialized
    // So we check if it exists first
    if (typeof UoEnvironment !== 'undefined' && UoEnvironment.shared) {
      const config = UoEnvironment.shared().getProxyConfig();
      this.setIsSecure(config.isSecure);
      this.setSubdomain(config.subdomain);
      this.setDomain(config.domain);
      this.setPort(config.port);
      this.setPath(config.path);
      this.setParameterName(config.parameterName);
    } else {
      // Fallback to basic configuration if UoEnvironment isn't available yet
      // This can happen during early initialization
      const loc = window.location;
      this.setHostname(loc.hostname);
      this.setPort(Number(loc.port) || null);
      this.setIsSecure(loc.protocol === "https:");
      this.setPath("/proxy");
      this.setParameterName("proxyUrl");
    }
  }

}.initThisClass());