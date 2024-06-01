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

  initPrototypeSlots () {
    this.setSubnodeClasses([ProxyServer]);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setNoteIsSubnodeCount(false);
    this.setTitle("Proxies");
    this.setSubtitle("web proxy servers");
  }

  finalInit() {
    super.finalInit()
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
