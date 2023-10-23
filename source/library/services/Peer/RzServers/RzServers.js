"use strict";

/* 
    RzServers

*/

(class RzServers extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("Servers");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([RzServer]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setTitle("Rendezvous Servers");
    this.setNoteIsSubnodeCount(true);
    this.setupDefaultServers()
  }

  setupDefaultServers () {
    const map = this.fullPathToServerMap() // TODO: use node hash support instead
    this.defaultServerDicts().forEach(dict => {
      const fullPath = RzServer.fullPathForDict(dict)
      const server = map.at(fullPath)
      if (!server) {
        const newServer = RzServer.clone().setDict(dict)
        this.addSubnode(newServer)
        map.atPut(newServer.fullPath(), newServer)
      }
    })
  }

  fullPathToServerMap () {
    const m = new Map()
    this.servers().forEach(server => m.atPut(server.fullPath(), server))
    return m
  }

  defaultServerDicts () {
    return [
      {
        host: "peerjssignalserver.herokuapp.com",
        path: "/peerjs",
        isSecure: true,
        port: 443,
        isReliable: true,
        pingInterval: 1000, // 1 second
        debug: false
      }
    ]
  }

  servers () {
    return this.subnodes()
  }

  /*
  didInit () {
    super.didInit()
  }
  */

  service () {
    return this.parentNode()
  }

}.initThisClass());
