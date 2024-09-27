/**
 * @module local-web-server
 */

"use strict";

require("./getGlobalThis.js")
require("./Base.js")
require("./StrvctHttpsServerRequest.js")

const https = require('https');
const http = require('http');
const fs = require('fs');
const nodePath = require('path');

/**
 * @class StrvctHttpsServer
 * @extends Base
 * @classdesc Represents an HTTPS server with optional HTTP support.
 */
(class StrvctHttpsServer extends Base {
	
	/**
	 * Initializes the prototype slots for the StrvctHttpsServer.
	 */
	initPrototypeSlots () {
		/**
		 * @member {Object} server - The server instance.
		 */
		this.newSlot("server", null);

		/**
		 * @member {string} hostname - The hostname for the server.
		 */
		this.newSlot("hostname", "localhost");

		/**
		 * @member {number} port - The port number for the server.
		 */
		this.newSlot("port", null);

		/**
		 * @member {string} keyPath - The path to the server key file.
		 */
		this.newSlot("keyPath", null);

		/**
		 * @member {string} certPath - The path to the server certificate file.
		 */
		this.newSlot("certPath", null);

		/**
		 * @member {boolean} isSecure - Indicates whether the server should use HTTPS.
		 */
		this.newSlot("isSecure", true);
	}
  
	/**
	 * Initializes the prototype.
	 */
	initPrototype () {
	}

	/**
	 * Initializes the StrvctHttpsServer instance.
	 * @returns {StrvctHttpsServer} The initialized instance.
	 */
	init () {
		super.init();
		this.setPort(8000);
		this.setKeyPath(nodePath.join(__dirname, 'keys/server.key'));
		this.setCertPath(nodePath.join(__dirname, 'keys/server.crt'));
		return this
	}
	
	/**
	 * Returns the options for creating an HTTPS server.
	 * @returns {Object} The server options.
	 */
	options () {
		return {
			key: fs.readFileSync(this.keyPath()),
			cert: fs.readFileSync(this.certPath())
		}
	}

	/**
	 * Returns the protocol being used by the server.
	 * @returns {string} The protocol ("https" or "http").
	 */
	protocol () {
		return this.isSecure() ? "https" : "http";
	}

	/**
	 * Runs the server.
	 */
	run () {
		if (this.isSecure()) {
			console.log("running HTTPS");
			this._server = https.createServer(this.options(), (request, response) => { 
				this.onRequest(request, response) 
			});
		} else {
			console.log("running HTTP");
			this._server = http.createServer((request, response) => {
				this.onRequest(request, response) 
			});
		}

		this._server.listen(this.port());

		const sandboxPath =  process.cwd()
		console.log(this.type() + ":")
		console.log("      cwd: '" + sandboxPath + "'")
		console.log("     port: " + this.port())
		console.log(" isSecure: " + this.isSecure())
		console.log("      url: " + this.protocol() + "://" + this.hostname() + ":" + this.port() + "/index.html")
	}

	/**
	 * Handles incoming requests.
	 * @param {Object} request - The incoming request object.
	 * @param {Object} response - The response object.
	 */
	onRequest (request, response) {
		//console.log("got request ", request)
		try {
			const r = StrvctHttpsServerRequest.clone();
			r.setServer(this);
			r.setRequest(request);
			r.setResponse(response);
			r.process();
		} catch (error) {
			console.warn("Caught StrvctHttpsServerRequest exception:", error);
		}
	}

	/**
	 * Waits for a specified number of milliseconds.
	 * @param {number} ms - The number of milliseconds to wait.
	 */
	wait (ms) {
		console.log("wait(" + ms + ")");
		const start = Date.now();
		while (Date.now() - start < ms) {
			// do nothing
		}
	}

}.initThisClass());