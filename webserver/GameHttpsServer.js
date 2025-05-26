/**
 * @module local-web-server
 */

"use strict";

const { BaseHttpsServer } = require("../../../../WebServer");
const GameHttpsServerRequest = require("./GameHttpsServerRequest.js");

/**
 * @class GameHttpsServer
 * @extends BaseHttpsServer
 * @classdesc Game server implementation extending the base HTTPS server.
 */
(class GameHttpsServer extends BaseHttpsServer {
    
    /**
     * Initializes the prototype slots for the GameHttpsServer.
     */
    initPrototypeSlots () {
        super.initPrototypeSlots();
        
        /**
         * @member {string} logsPath - The path to store error logs.
         */
        this.newSlot("logsPath", "logs/errors");
    }
  
    /**
     * Returns the server name.
     * @returns {string} The server name.
     */
    serverName () {
        return "GameServer";
    }

    /**
     * Returns the request handler class.
     * @returns {typeof GameHttpsServerRequest} The request handler class.
     */
    requestClass () {
        return GameHttpsServerRequest;
    }

}).initThisClass();

module.exports = GameHttpsServer;