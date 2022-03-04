

require("./getGlobalThis.js")
require("./Base.js")
require("./StrvctHttpsServerRequest.js")

const https = require('https');
const fs = require('fs');
//var vm = require('vm')
const nodePath = require('path');


(class StrvctHttpsServer extends Base {
	initPrototype () {
		this.newSlot("server", null);
		this.newSlot("hostname", "localhost");
		this.newSlot("port", 8000);
	}

	serverKeyPath () {
		return nodePath.join(__dirname, 'keys/server.key')
	}

	serverCertPath () {
		return nodePath.join(__dirname, 'keys/server.crt')
	}

	init () {
		super.init()
		return this
	}

	options () {
		return {
			key: fs.readFileSync(this.serverKeyPath()),
			cert: fs.readFileSync(this.serverCertPath())
		}
	}

	run() {
		/*
		require("../source/boot/ResourceLoader.js")
		//vm.runInThisContext(fs.readFileSync(__dirname + "/mime_extensions.js"))
		//vm.runInThisContext(fs.readFileSync(__dirname + "/../source/boot/ResourceLoader.js"))
		*/

		this._server = https.createServer(this.options(), (request, response) => { 
			this.onRequest(request, response) 
		})
		this._server.listen(this.port());

		console.log("listening on port " + this.port() + " - connect with https://" + this.hostname() + ":" + this.port() + "/index.html")
	}

	onRequest(request, response) {
		const r = new StrvctHttpsServerRequest()
		r.setServer(this)
		r.setRequest(request)
		r.setResponse(response)
		//this.wait(10);
		r.process()
	}

	wait(ms) {
		console.log("wait(" + ms + ")");
		const start = Date.now();
		while (Date.now() - start < ms) {
			// do nothing
		}
	}
}.initThisClass());

