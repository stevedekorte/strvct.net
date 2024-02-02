"use strict";

/*

TODO: respond to paths in:

 /.well-known/acme-challenge/ 
 
using the contents of: 
 
 /home/public/.well-known/acme-challenge/. 


 NOTES:

 Cache-Control:
 'no-cache' allows caching but requires revalidation.
 'no-store' disallows any caching.
 'private' allows caching but only in a private cache (like a user's browser), not in shared caches.

*/

require("./getGlobalThis.js");
require("./Base.js");
require("./MimeExtensions.js");
const fs = require('fs');
const nodePath = require('path');
//const { PassThrough } = require('stream');
const https = require('https');

(class StrvctHttpsServerRequest extends Base {
	
	initPrototypeSlots () {
		this.newSlot("server", null);
		this.newSlot("request", null);
		this.newSlot("response", null);
		this.newSlot("urlObject", null);
		this.newSlot("queryMap", null);
		this.newSlot("path", null);
		this.newSlot("localAcmePath", "/home/public/.well-known/acme-challenge/");
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

		try {
			if (this.queryMap().get("proxyUrl")) {
				this.onProxyRequest()
			} else {
				this.onFileRequest(); // may throw exception for missing file, unathorized path, etc
			}
		} catch (error) {
			if (error._code) {
				this.response().writeHead(error._code, {});
				this.response().end();
				console.log(error.message);
			} else {
				throw error;
			}
		}
	}

	// --- handle proxy request --------------------------

	onProxyRequest () {
		try {
			const url = this.queryMap().get("proxyUrl");
			console.log("proxy request for: " + url + "");

			https.get(url, (res) => {
				// Check if the response is successful
				if (res.statusCode === 200) {
					const mimeType = res.headers['content-type'] ? res.headers['content-type'] : 'Unknown';
					console.log('Proxy MIME Type:', mimeType);
			
					this.response().writeHead(200, {
						'Content-Type': mimeType,
						'Cache-Control': 'private',
						'Access-Control-Allow-Origin': '*',
					});
			
					// Pipe the response directly to the server response
					res.pipe(this.response());
				} else {
					// Handle errors like 404 Not Found or 401 Unauthorized
					this.response().writeHead(res.statusCode);
					this.response().end(`Error: Received status code ${res.statusCode}`);
				}
			}).on('error', (e) => {
				console.error(`Error fetching the image: ${e.message}`);
				this.onProxyRequestError(e);
			});

			/*
			https.get(url, (res) => {

				const mimeType = res.headers['content-type'] ? res.headers['content-type'] : 'Unknown';
				console.log('Proxy MIME Type:', mimeType);

				this.response().writeHead(200, {
					'Content-Type': mimeType,
					'Access-Control-Allow-Origin': '*',
				});
				
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
		
					this.response().write(buffer);
					this.response().end();
				});
			}).on('error', (e) => {
				console.error(`Error fetching the image: ${e.message}`);
				this.onProxyRequestError(error)
			});
			*/

		} catch (e) {
			this.onProxyRequestError(e)
		}
	}

	/*
	onProxyRequestSuccess (mimeType, data) {
		// need to do this last so we know the mime type
		this.response().writeHead(200, {
			'Content-Type': mimeType,
			'Access-Control-Allow-Origin': '*',
		});

		this.response().write(data);
		this.response().end();
	}
	*/

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

		const acmePath = ".well-known/acme-challenge/"
		if (path.startsWith(acmePath)) {
			path = path.replace(acmePath, this.localAcmePath())
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

	assertPathInSandbox () {
		const path = this.path()

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
			this.throwCodeAndMessage(401, "error: attempt to access file path '" + path + "' which is outside of sandbox path '" + sandboxPath + "' relative path is '" + pathRelativeToCwd + "'");
		}
	}

	assertPathExists () {
		const path = this.path();
		if (!fs.existsSync(path)) {
			this.throwCodeAndMessage(404, "error: missing file ", path);
		}
	}

	assertNonDotPath () {
		const path = this.path();
		const dotComponents = path.split("/").filter(pathComponent => pathComponent.beginsWith("."));

		if (dotComponents.length !== 0) {
			this.throwCodeAndMessage(401, "error: attempt to access file path '" + path + "' which contains a path component begining with a dot.");
		}
	}

	throwCodeAndMessage (code, message) {
		const error = new Error(message)
		error._code = code;
		throw error;
	}

	async onFileRequest () {
		//console.log("  path:" + path)
		const path = this.path()

		// Ensure there is a file extension
		// need this to determine contentType

		const ext = this.getPathExtension()
		//console.log("  ext:" + ext)

		if (!ext) {
			this.throwCodeAndMessage(401, "  error: no file extension found in path: '" + path + "'");
			return
		}

		// Ensure request is for a valid content type
		// need this so client will accept our contentType response header

		let contentType = MimeExtensions.shared().mimeTypeForPathExtension(ext)

		if (!contentType) {
			//contentType = MimeExtensions.shared().mimeTypeForPathExtension("txt")
			contentType = "application/octet-stream";
			console.log("  WARNING: no known mime type for extension: '" + ext + "' so we'll assume " + contentType);
			/*
			this.response().writeHead(401, {})
			this.response().end()
			console.log("  error: no known mime type for extension: '" + ext + "'")
			return
			*/
		}

		if (path.startsWith(this.localAcmePath())) {
			// we'll allow a read outside of the sandbox for localAcmePath (used for DNS key setup)
		} else {
			this.assertPathInSandbox();
		}

		this.assertPathExists();
		this.assertNonDotPath();

		// Send header and stream file response

		const header = {
			'Content-Type': contentType,
			'Cache-Control': 'no-cache',
			'Access-Control-Allow-Origin': '*',
		};

		this.response().writeHead(200, header);
		//console.log("header:" + JSON.stringify(header));

		//this.syncWriteFileToResponse(path, this.response());
		this.streamFileContentToResponse(path, this.response());
	}

	/*
	syncWriteFileToResponse (path, response) {
		const data = fs.readFileSync(path)
		//this.response().write(data.toString());		
		this.response().write(data);
		//console.log("  sent " + data.length + " bytes")	
		this.response().end();
	}
	*/

	streamFileContentToResponse (path, response) {
		const readStream = fs.createReadStream(path);
	
		readStream.on('error', (error) => {
			// Handle error, such as file not found
			console.error('Error reading file:', error);
			// Optionally, send an error response
			response.writeHead(500, {'Content-Type': 'text/plain'});
			response.end('Error reading file');
			//this.throwCodeAndMessage(500, "error: reading file ", path);
		});
	
		readStream.pipe(response);
		return this;
	}

	/*
	onQuery () {
		//how to handle non-file requests?
		//http://host/path?query
		//ignore path, send decoded query dict to app handleQuery(queryDict) method? 	

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
	*/
	
}.initThisClass());
