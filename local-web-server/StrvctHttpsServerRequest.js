"use strict";


require("./getGlobalThis.js")
require("./Base.js")
require("./MimeExtensions.js")
const fs = require('fs');
const nodePath = require('path');

const https = require('https');

(class StrvctHttpsServerRequest extends Base {
	
	initPrototypeSlots () {
		this.newSlot("server", null)
		this.newSlot("request", null)
		this.newSlot("response", null)
		this.newSlot("urlObject", null)
		this.newSlot("queryMap", null)
		this.newSlot("path", null)
	}

	process () {
		//this.response().write("request:\n, this.requestDescription(request))
		console.log("request url:" + this.request().url)
		//console.log("  decoded url:" + decodeURI(this.request().url))
		this.setUrlObject(this.getUrlObject())
	
		this.setQueryMap(this.getQueryMap())
		this.setPath(this.getPath())

		//console.log("  path: '" + this.path() + "'\n" );			
		//console.log("  getQueryMap entries: '" + JSON.stringify([...this.queryMap().entries()], 2, 2) + "'\n" );		

		if (this.queryMap().get("proxyUrl")) {
			this.onProxyRequest()
		} else {
			this.onFileRequest();
		}
	}

	// --- handle proxy request --------------------------

	async onProxyRequest () {
		try {
			const url = this.queryMap().get("proxyUrl");
			console.log("proxy request for: " + url + "");
			https.get(url, (res) => {

				const mimeType = res.headers['content-type'] ? res.headers['content-type'] : 'Unknown';
				console.log('Proxy MIME Type:', mimeType);

				// Array to hold the chunks of data
				const chunks = [];
		
				// Listen for data events to receive chunks of data
				res.on('data', (chunk) => {
					chunks.push(chunk);
				});
		
				// When the response has ended
				res.on('end', () => {
					// Combine all the chunks into a single buffer
					const buffer = Buffer.concat(chunks);
		
					// Display the byte size of the image
					console.log('Proxy Byte count:', buffer.length);
					this.onProxyRequestSuccess(mimeType, buffer)
				});
			}).on('error', (e) => {
				console.error(`Error fetching the image: ${e.message}`);
				this.onProxyRequestError(error)
			});

		} catch (e) {
			this.onProxyRequestError(e)
		}
	}

	onProxyRequestSuccess (mimeType, data) {
		this.response().writeHead(200, {
			'Content-Type': mimeType,
			'Access-Control-Allow-Origin': '*',
		});

		this.response().write(data);
		this.response().end();
	}

	onProxyRequestError (error) {
		console.error('proxy request error:', error.message);
	}

	// -----------------------------

	getUrlObject () {
		return new URL("https://" + this.server().hostname() + this.request().url)
	}

	getPath () {
		//return nodePath.join(process.cwd(), decodeURI(this.urlObject().pathname))
		let path = nodePath.join(".", decodeURI(this.urlObject().pathname));
		if (path === "./") {
			path = "./index.html";
		}
		return path;
	}

	getPathExtension () {
		if (this.path().indexOf(".") !== -1) {
			return this.path().split('.').pop();
		}
		return undefined
	}

	requestDescription () {
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

	getQueryMap () {
		const queryMap = new Map()
		const entries = Array.from(this.urlObject().searchParams.entries())
		entries.forEach(entry => { 
			queryMap.set(entry[0], entry[1]);
		})
		return queryMap
	}

	onFileRequest () {
		//console.log("  path:" + path)
		const path = this.path()

		// Ensure there is a file extension
		// need this to determine contentType

		const ext = this.getPathExtension()
		//console.log("  ext:" + ext)

		if (!ext) {
			this.response().writeHead(401, {});
			this.response().end()
			console.log("  error: no file extension found in path: '" + path + "'")
			return
		}

		// Ensure request is for a valid content type
		// need this so client will accept our contentType response header

		let contentType = MimeExtensions.shared().mimeTypeForPathExtension(ext)

		if (!contentType) {
			contentType = MimeExtensions.shared().mimeTypeForPathExtension("txt")
			console.log("  error: no known mime type for extension: '" + ext + "' so we'll assume " + contentType)
			/*
			this.response().writeHead(401, {})
			this.response().end()
			console.log("  error: no known mime type for extension: '" + ext + "'")
			return
			*/
		}

		// Ensure path is within sandbox

		const sandboxPath =  process.cwd()
		const normalPath = nodePath.normalize(path)
		const pathRelativeToCwd = nodePath.relative(sandboxPath, normalPath); // relative from, to

		/*
		console.log("path: '" + path + "'")
		console.log("sandboxPath: '" + sandboxPath + "'")
		console.log("normalPath: '" + normalPath + "'")
		console.log("pathRelativeToCwd: '" + pathRelativeToCwd + "'")
		console.log("---")
		*/

		if (pathRelativeToCwd.indexOf("..") !== -1) {
			this.response().writeHead(401, {});
			this.response().end()
			console.log("  error: attempt to access file path '" + path + "' which is outside of sandbox path '" + sandboxPath + "' relative path is '" + pathRelativeToCwd + "'")
			return
		}

		// Ensure file exists

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

	onQuery () {
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
}.initThisClass());
