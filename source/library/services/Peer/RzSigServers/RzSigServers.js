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
    this.setTitle("PeerJS Signalling Servers");
    this.setNoteIsSubnodeCount(true);
    this.setupDefaultServers()
  }

  setupDefaultServers () {
    const map = this.jsonStringToServerMap() // TODO: use node hash support instead
    this.defaultServerDicts().forEach(dict => {
      const jsonString = JSON.stableStringify(dict);
      const server = map.at(jsonString)
      if (!server) {
        const newServer = RzSigServer.clone().setDict(dict)
        this.addSubnode(newServer)
        map.atPut(jsonString, newServer)
      }
    });
  }

  jsonStringToServerMap () {
    const m = new Map();
    this.servers().forEach(server => {
      const k = JSON.stableStringify(server.dict());
      m.atPut(k, server);
    });
    return m;
  }

  defaultServerDicts () {
    return [
      {
        host: "peerjssignalserver.herokuapp.com",
        path: "/peerjs",
        isSecure: true,
        port: 443
        //webSocketPort: 443
        /*
        // this are server connection settings 
        isReliable: true,
        pingInterval: 1000, // 1 second
        debug: false
        */
      },
      {
        host: "undreamedof.ai",
        path: "/peerjs",
        isSecure: true,
        port: 9000
        //webSocketPort: 9001
        /*
        isReliable: true,
        pingInterval: 1000, // 1 second
        debug: false
        */
      },
      {
        host: "localhost",
        path: "/peerjs",
        isSecure: true,
        port: 9000
        //webSocketPort: 9001
        /*
        isReliable: true,
        pingInterval: 1000, // 1 second
        debug: false
        */
      }
    ]
  }

  servers () {
    return this.subnodes();
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
