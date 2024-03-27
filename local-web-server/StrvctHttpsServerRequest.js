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


	proxyCurlCommandForOptions (options) {
		const commandParts = [];
		const url = "https://" + options.hostname + options.path;
		commandParts.push("curl  --insecure '" + url + "'");
		const headers = options.headers;
	
		 Object.keys(headers).forEach((key) => {
		  const value = headers[key];
		  commandParts.push(" --header '" + key + ": " + value + "'");
		});
	
		// it becomes a POST reqeust if there is a body
		//const data = "" //JSON.stringify(this.bodyJson());
		//commandParts.push(" --data '" + data + "'");
		return commandParts.join(" \\\n");
	  }

	  
	onProxyRequest () {

		/* 
		example headers:

		"method": "POST",
		"headers": {
		  "host": "localhost:8000",
		  "connection": "keep-alive",
		  "content-length": "122",
		  "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
		  "anthropic-beta": "messages-2023-12-15",
		  "sec-ch-ua-mobile": "?0",
		  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
		  "authorization": "Bearer I_USED_MY_KEY_ HERE",
		  "content-type": "application/json",
		  "anthropic-version": "2023-06-01",
		  "sec-ch-ua-platform": "\"macOS\"",
		  "origin": "https://localhost:8000",
		  "sec-fetch-site": "same-origin",
		  "sec-fetch-mode": "cors",
		  "sec-fetch-dest": "empty",
		  "referer": "https://localhost:8000/index.html",
		  "accept-encoding": "gzip, deflate, br",
		  "accept-language": "en-US,en;q=0.9",
		  "Host": "api.anthropic.com"
		},
		*/

		//also: "accept": "*/*",

		try {
			const req = this.request();
			const res = this.response();

			const url = this.queryMap().get("proxyUrl");
			console.log("proxy request for: " + url + "");

			const parsedUrl = new URL(url);
			const hostname = parsedUrl.hostname;
			// Incoming request handler
			const options = {
				hostname: hostname,
				path: parsedUrl.pathname + parsedUrl.search,
				method: req.method,
				headers: {
					...req.headers				
				},
				rejectUnauthorized: false // Allow self-signed certificates
			};

			const unneededHeaderKeys = [
				"Host",
				"sec-fetch-dest", 
				"referer", 
				"connection",
				"sec-ch-ua",
				"sec-ch-ua-mobile",
				"sec-ch-ua-platform",
				"accept-language",
				"accept-encoding"
			]; // not sure if this is needed

			unneededHeaderKeys.forEach(key => delete options.headers[key]);

			options.headers["host"] = hostname;
			options.headers["sec-fetch-mode"] = "cors"; //"same-origin";

			/* 
			    Here is where we have a chance to insert auth keys, etc.

			    If clients shares these headers:
				- x-user-public-key
				- x-user-request-signature 
				- x-user-service-name

				then we can:
			   - verify user is in our system and has credits
			   - verify signture for request
			   - if all checks out, we lookup and add appropriate service auth key header

			   
			*/
		
			let responseBody = [];

			/*
			console.log("----------------------------------------------------");
			console.log("proxy request options: ", JSON.stringify(options, null, 2));
			console.log("----------------------------------------------------");
			console.log("proxyCurlCommandForOptions: " +this.proxyCurlCommandForOptions(options));
			console.log("----------------------------------------------------");
			*/

			const reqBodyParts = [];

			const proxyReq = https.request(options, (proxyRes) => {
				const headers = proxyRes.headers;
				//headers['Content-Type'] = mimeType;
				delete headers['Access-Control-Allow-Origin'.toLowerCase()];
				headers['Access-Control-Allow-Origin'] = '*',
				//assert(proxyRes.statusCode === 200, "proxy request failed with status code: " + proxyRes.statusCode);
				res.writeHead(proxyRes.statusCode, proxyRes.headers);

				proxyRes.on('data', (chunk) => {
					responseBody.push(chunk);
					res.write(chunk);
				});
	
				proxyRes.on('end', () => {
					const contentType = proxyRes.headers['content-type'];
					const contentEncoding = proxyRes.headers['content-encoding'];
					const responseBuffer = Buffer.concat(responseBody);
					//console.log('proxyRes headers: ', JSON.stringify(proxyRes.headers, null, 2));
					console.log('proxyRes responseBuffer.byteLength: ', responseBuffer.byteLength, " bytes in " + contentEncoding + " encoding");
			
					res.end();
				});
				
				// ...
			
				proxyRes.on('error', (error) => {
					console.error(`Error: ${error.message}`);
					//res.statusCode = proxyRes.statusCode; // may be undefined

					const errorMessage = "proxy request error: '" + error.message + "' " + this.nameForXhrStatusCode(proxyReq.statusCode) + " for url: " + url + "";
					console.log(errorMessage);
					console.log("responseBody: '" + responseBody + "'");

					res.statusCode = 500;
					res.end('Internal Server Error');
				});
			});
		
			req.on('data', (chunk) => {
				reqBodyParts.push(chunk);
				proxyReq.write(chunk);
			});
		
			req.on('end', () => {
				proxyReq.end();

				if (reqBodyParts.length > 0) {
					const contentType = req.headers['content-type'];
					if (contentType) {
						const isText = contentType.startsWith('text') || contentType.startsWith('application/json') || contentType.startsWith('application/javascript');
						if (isText) {
							console.log("  request body is text of " + Buffer.concat(reqBodyParts).byteLength + " bytes");
							//const body = Buffer.concat(reqBodyParts).toString('utf-8');
							//console.log(body); // only works for text
							//console.log("  request body is text of " + body.length + " characters");
						} else {
							console.log("  request body is binary of " + Buffer.concat(reqBodyParts).byteLength + " bytes");
						}
					}
				}
			});
		

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
			//path = "index.html";
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
			this.throwCodeAndMessage(404, "404 error: missing file '" + path + "'");
		}
	}

	assertNonDotPath () {
		const path = this.path();
		const dotComponents = path.split("/").filter(pathComponent => pathComponent.startsWith(".."));

		if (dotComponents.length !== 0) {
			this.throwCodeAndMessage(401, "error: attempt to access file path '" + path + "' which contains a path component begining with a dot.");
		}
	}

	throwCodeAndMessage (code, message) {
		//debugger;
		const error = new Error(message);
		error._code = code;
		throw error;
	}

	async onFileRequest () {
		try {
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
		} catch (error) {
			if (error._code) {
				this.response().writeHead(error._code, {'Content-Type': 'text/plain'});
				this.response().end(error.message);
				console.log("ERROR CODE: " + error._code + " MESSAGE:" + error.message);
			} else {
				console.log("ERROR: ", error.message);
			}
		}
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

	nameForXhrStatusCode (statusCode) {
		/**
		   * This function returns a brief description of an XHR status code.
		   * 
		   * @param {number} statusCode - The XHR status code.
		   * @returns {string} - A brief description of the status, or "Unknown status".
		   */
	
		const xhrStatuses = {
		  0: "Not started: Network Error, Request Blocked, or CORS issue",
		  100: "Continue",
		  101: "Switching protocols",
		  200: "OK - Request successful",
		  201: "Created - Resource created",
		  301: "Moved permanently",
		  304: "Not modified",
		  400: "Bad request", 
		  401: "Unauthorized",
		  403: "Forbidden",
		  404: "Not found",
		  500: "Internal server error" 
		};
	
		return statusCode + " (" + (xhrStatuses[statusCode] || "Unknown status") + ")";
	  }
	
	  /*
	  nameForXhrReadyState (readyState) {
		 // This function returns a brief description of an XHR readyState.
		 // 
		 // @param {number} readyState - The XHR readyState value.
		 // @returns {string} - A brief description of the state, or "Unknown state".
		 //
	
		const xhrStates = {
		  0: "Request not initialized",
		  1: "Server connection established",
		  2: "Request received",
		  3: "Processing request",
		  4: "Request finished"
		};
	
		return status + " (" + (xhrStates[readyState] || "Unknown ready state") + ")";
	  }
	  */
	

}.initThisClass());
