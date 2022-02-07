

require("./getGlobalThis.js")
require("./Base.js")
require("./StrvctHttpsServerRequest.js")

const https = require('https');
const fs = require('fs');
//var vm = require('vm')


(class StrvctHttpsServer extends Base {
	initPrototype () {
		this.newSlot("options", null)
		this.newSlot("server", null);
		this.newSlot("hostname", "localhost");
		this.newSlot("port", 8000);
	}

	init () {
		this.setOptions({
			key: fs.readFileSync('keys/server.key'),
			cert: fs.readFileSync('keys/server.crt')
		})
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

		console.log("listening on port " + this.port() + " - connect with https://localhost:8000/index.html")
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

