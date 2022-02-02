

require("./getGlobalThis.js")
require("./Base.js")
require("./MimeExtensions.js")

// ---------------------------------------------------------------------

const https = require('https');
const fs = require('fs');
//var vm = require('vm')


class StrvctHttpsServerRequest extends Base {
	constructor() {
		super()
		this.newSlot("server", null)
		this.newSlot("request", null)
		this.newSlot("response", null)
		this.newSlot("urlObject", null)
		this.newSlot("queryDict", null)
		this.newSlot("path", null)
	}

	process() {
		//this.response().write("request:\n, this.requestDescription(request))
		//console.log("request url:" + this.request().url)
		//console.log("  decoded url:" + decodeURI(this.request().url))
		//response.write("  path: '" + url.pathname + "'\n" );			
		this.setUrlObject(this.getUrlObject())
		this.setQueryDict(this.getQueryDict())
		this.setPath(this.getPath())

		if (this.queryDict()) {
			this.onQuery()
		} else {
			this.onFileRequest()
		}
	}

	getUrlObject () {
		return new URL("https://" + this.server().hostname() + this.request().url)
	}

	getPath () {
		return ".." + decodeURI(this.urlObject().pathname)
	}

	getPathExtension() {
		if (this.path().indexOf(".") !== -1) {
			return this.path().split('.').pop();
		}
		return undefined
	}

	requestDescription() {
		const request = this.request()
		let s = ""
		const keys = []

		for (k in request) {
			keys.push(k)
		}
		keys.sort()

		keys.forEach((k) => {
			const v = request[k]
			const t = typeof (v)
			if (["string", "number"].contains(t)) {
				s += "  " + k + ": '" + v + "'\n";
			} else {
				s += "  " + k + ": " + t + "\n";
			}
		})
		return s
	}

	getQueryDict () {
		const queryDict = {}
		const entries = Array.from(this.urlObject().searchParams.entries())
		entries.forEach(entry => { 
			queryDict[entry[0]] = entry[1]
		})

		if (Object.keys(queryDict).length > 0) {
			console.log("  queryDict = ", queryDict)
			return queryDict
		}
		return null
	}

	onFileRequest () {
		//console.log("  path:" + path)
		const path = this.path()

		if (path.indexOf("..") !== 0) {
			this.response().writeHead(401, {});
			this.response().end()
			console.log("  error: invalid path '" + path + "'")
			return
		}

		// Ensure there is a file extension
		// need this to determine contentType

		const ext = this.getPathExtension()
		//console.log("  ext:" + ext)

		if (!ext) {
			this.response().writeHead(401, {});
			this.response().end()
			console.log("  error: no file extension '" + ext + "'")
			return
		}

		// Ensure request is for a valid content type
		// need this so client will accept our contentType response header

		const contentType = MimeExtensions.shared().mimeTypeForPathExtension(ext)

		if (!contentType) {
			this.response().writeHead(401, {})
			this.response().end()
			console.log("  error: invalid extension ", ext)
			return
		}

		// Ensure path is within sandbox

		/*
		if (path.indexOf("/") === 0 || path.indexOf("..") !== -1) {
			this.response().writeHead(401, {});
			this.response().end()
			console.log("  error: attempt to access file path outside of sandbox '" + path + "'")
			return
		}
		*/

		// Ensure valid file path

		if (!fs.existsSync(path)) {
			this.response().writeHead(401, {});
			this.response().end()
			console.log("  error: missing file ", path)
			return
		}

		// read file and send response

		this.response().writeHead(200, {
			'Content-Type': contentType,
			'Access-Control-Allow-Origin': '*',
		});

		const data = fs.readFileSync(path)
		//this.response().write(data.toString());		
		this.response().write(data);
		//console.log("  sent " + data.length + " bytes")	
		this.response().end();
	}

	onQuery() {
		/*
		how to handle non-file requests?
		http://host/path?query
		ignore path, send decoded query dict to app handleQuery(queryDict) method? 	
		*/

		const resultJson = app.handleServerRequest(this.request(), this.response(), this.queryDict())
		const jsonString = JSON.stringify(resultJson)

		this.response().writeHead(200, {
			'Content-Type': "application/json",
			'Access-Control-Allow-Origin': '*',
		});
		this.response().write(jsonString);
		//console.log("  sent json " + jsonString.length + " bytes")	
		this.response().end();
		return
	}
}

// -------------------------------------------------------------

class StrvctHttpsServer extends Base {
	constructor() {
		super()
		this.newSlot("options", {
			key: fs.readFileSync('keys/server.key'),
			cert: fs.readFileSync('keys/server.crt')
		})

		this.newSlot("server", null);
		this.newSlot("hostname", "localhost");
		this.newSlot("port", 8000);
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
		r.process()
	}
}

const server = new StrvctHttpsServer()
server.run()

