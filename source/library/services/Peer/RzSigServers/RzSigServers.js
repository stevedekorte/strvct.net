"use strict";

/**
 * @module library.services.Peer.RzSigServers
 */

/**
 * @class RzSigServers
 * @extends BMSummaryNode
 * @classdesc RzSigServers manages a collection of PeerJS Signalling Servers.
 */
(class RzSigServers extends BMSummaryNode {
  /**
   * @description Initializes the prototype slots for the RzSigServers class.
   */
  initPrototypeSlots () {
    this.setSubnodeClasses([RzSigServer]);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setTitle("PeerJS Signalling Servers");
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * @description Performs final initialization tasks.
   */
  finalInit() {
    super.finalInit();
    this.setupDefaultServers();
  }

  /**
   * @description Sets up default servers.
   * @private
   */
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

  /**
   * @description Converts servers to a map with JSON string keys.
   * @returns {Map} A map of JSON strings to server objects.
   * @private
   */
  jsonStringToServerMap () {
    const m = new Map();
    this.servers().forEach(server => {
      const k = JSON.stableStringify(server.dict());
      m.atPut(k, server);
    });
    return m;
  }

  /**
   * @description Returns an array of default server configurations.
   * @returns {Array} An array of server configuration objects.
   * @private
   */
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

  /**
   * @description Returns an array of server objects.
   * @returns {Array} An array of RzSigServer objects.
   */
  servers () {
    return this.subnodes();
  }

  /*
  didInit () {
    super.didInit()
  }
  */

  /**
   * @description Returns the parent service node.
   * @returns {Object} The parent service node.
   */
  service () {
    return this.parentNode()
  }

}.initThisClass());