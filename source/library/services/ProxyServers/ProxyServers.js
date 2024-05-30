"use strict";

/* 
    ProxyServers

    example use:

    const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(targetUrl);

*/

(class ProxyServers extends BMSummaryNode {
      
  static initClass () {
    this.setIsSingleton(true)
    return this
  }

  initPrototypeSlots() {
    this.setSubnodeClasses([ProxyServer]);
  }

  init() {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(false);

    this.setTitle("Proxies");
    this.setSubtitle("web proxy servers");
    this.addDefaultIfNeeded()
  }

  addDefaultIfNeeded () {
    if (this.subnodesCount() === 0) {
      this.addSubnode(DefaultProxyServer.clone())
    }
  }

  defaultServer () {
    return this.subnodes().first()
  }

}.initThisClass());
