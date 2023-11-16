"use strict";

/* 
    RzSigServers

*/

(class RzSigServers extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([RzSigServer]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setTitle("PeerJS Signal Servers");
    this.setNoteIsSubnodeCount(true);
    this.setupDefaultServers()
  }

  setupDefaultServers () {
    const map = this.fullPathToServerMap() // TODO: use node hash support instead
    this.defaultServerDicts().forEach(dict => {
      const fullPath = RzSigServer.fullPathForDict(dict)
      const server = map.at(fullPath)
      if (!server) {
        const newServer = RzSigServer.clone().setDict(dict)
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
