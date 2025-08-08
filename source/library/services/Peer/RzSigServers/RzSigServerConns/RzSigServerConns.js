"use strict";

/**
  * @module library.services.Peer.RzSigServers.RzSigServerConns
  */

/**
  * @class RzSigServerConns
  * @extends SvSummaryNode
  * @classdesc Represents connections to sigserver
  */
(class RzSigServerConns extends SvSummaryNode {
    /**
      * @description Initializes prototype slots
      * @category Initialization
      */
    initPrototypeSlots () {
        this.setSubnodeClasses([RzSigServerConn]);
    }

    /**
      * @description Initializes the instance
      * @category Initialization
      */
    init() {
        super.init();
        this.setTitle("connections to sigserver");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
    }

    /**
      * @description Performs final initialization
      * @category Initialization
      */
    finalInit() {
        super.finalInit()
        this.setNoteIsSubnodeCount(true);
        this.removeAllSubnodes();
    }

    /**
      * @description Gets the parent service
      * @returns {Object} The parent service
      * @category Service
      */
    service () {
        return this.parentNode()
    }

    /**
      * @description Gets the connection class
      * @returns {Object} The connection class
      * @category Connection
      */
    connClass () {
        return this.subnodeClasses().first()
    }

    /*
    addWithPeerId (requestedPeerId) {
        const conn = this.connClass().clone()
        conn.setPeerId(requestedPeerId)
        this.addSubnode(conn)
        return conn
    }
    */

}.initThisClass());