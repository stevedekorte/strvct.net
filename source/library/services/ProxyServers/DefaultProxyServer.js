"use strict";

/* 
    ProxyServer

*/

(class DefaultProxyServer extends ProxyServer {
  initPrototypeSlots() {
  }

  init() {
    super.init();
  }

  finalInit() {
    super.finalInit()
    this.setTitle("Default Proxy Server");
    this.setParameterName("proxyUrl");
    this.setupForPage()
  }

  setupForPage () {
    this.setHostname(window.location.hostname);
    this.setPort(window.location.port);
    this.setIsSecure(window.location.protocol === "https:");
  }

}.initThisClass());
