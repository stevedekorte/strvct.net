"use strict";

require("./getGlobalThis.js")
require("./Base.js")
require("./StrvctHttpsServerRequest.js")

const https = require('https');
const http = require('http');
const fs = require('fs');
const nodePath = require('path');

(class StrvctHttpsServer extends Base {
	
	initPrototypeSlots () {
		this.newSlot("server", null);
		this.newSlot("hostname", "localhost");
		this.newSlot("port", null);
		this.newSlot("keyPath", null);
		this.newSlot("certPath", null);
		this.newSlot("isSecure", true);
	}

	init () {
		super.init();
		this.setPort(8000);
		this.setKeyPath(nodePath.join(__dirname, 'keys/server.key'));
		this.setCertPath(nodePath.join(__dirname, 'keys/server.crt'));
		return this
	}
	
	options () {
		return {
			key: fs.readFileSync(this.keyPath()),
			cert: fs.readFileSync(this.certPath())
		}
	}

	protocol () {
		return this.isSecure() ? "https" : "http";
	}

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

	wait (ms) {
		console.log("wait(" + ms + ")");
		const start = Date.now();
		while (Date.now() - start < ms) {
			// do nothing
		}
	}

}.initThisClass());
