/**
 * @module
 */

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

/**
 * @class StrvctHttpsServerRequest
 * @extends Base
 * @classdesc Handles HTTPS server requests, including file and proxy requests.
 */
(class StrvctHttpsServerRequest extends Base {
	
	initPrototypeSlots () {
		/**
		 * @member {Object} server - The server instance.
		 */
		this.newSlot("server", null);

		/**
		 * @member {Object} request - The request object.
		 */
		this.newSlot("request", null);

		/**
		 * @member {Object} response - The response object.
		 */
		this.newSlot("response", null);

		/**
		 * @member {URL} urlObject - The URL object of the request.
		 */
		this.newSlot("urlObject", null);

		/**
		 * @member {Map} queryMap - The query parameters as a Map.
		 */
		this.newSlot("queryMap", null);

		/**
		 * @member {string} path - The request path.
		 */
		this.newSlot("path", null);

		/**
		 * @member {string} localAcmePath - The local path for ACME challenge.
		 */
		this.newSlot("localAcmePath", "/home/public/.well-known/acme-challenge/");
	}
  
	initPrototype () {
	}

	/**
	 * @description Processes the incoming request.
	 */
	process () {
		console.log("request url:" + this.request().url)
		this.setUrlObject(this.getUrlObject())
	
		this.setQueryMap(this.getQueryMap())
		this.setPath(this.getPath())

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
				if (error.cause === undefined && typeof(Error.cause) === 'function') {
                    error.cause = error;
                }
				console.log("ERROR: ", error.message);
			}
		}
	}

	/**
	 * @description Generates a curl command for the given proxy options.
	 * @param {Object} options - The proxy options.
	 * @returns {string} The curl command.
	 */
	proxyCurlCommandForOptions (options) {
		const commandParts = [];
		const url = "https://" + options.hostname + options.path;
		commandParts.push("curl  --insecure '" + url + "'");
		const headers = options.headers;
	
		 Object.keys(headers).forEach((key) => {
		  const value = headers[key];
		  commandParts.push(" --header '" + key + ": " + value + "'");
		});
	
		return commandParts.join(" \\\n");
	  }

	/**
	 * @description Handles proxy requests.
	 */  
	onProxyRequest () {
		try {
			const req = this.request();
			const res = this.response();

			const url = this.queryMap().get("proxyUrl");
			console.log("proxy request for: " + url + "");

			const parsedUrl = new URL(url);
			const hostname = parsedUrl.hostname;
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
			];

			unneededHeaderKeys.forEach(key => delete options.headers[key]);

			options.headers["host"] = hostname;
			options.headers["sec-fetch-mode"] = "cors";
		
			let responseBody = [];

			const reqBodyParts = [];

			const proxyReq = https.request(options, (proxyRes) => {
				const headers = proxyRes.headers;
				delete headers['Access-Control-Allow-Origin'.toLowerCase()];
				headers['Access-Control-Allow-Origin'] = '*',
				res.writeHead(proxyRes.statusCode, proxyRes.headers);

				proxyRes.on('data', (chunk) => {
					responseBody.push(chunk);
					res.write(chunk);
				});
	
				proxyRes.on('end', () => {
					const contentType = proxyRes.headers['content-type'];
					const contentEncoding = proxyRes.headers['content-encoding'];
					const responseBuffer = Buffer.concat(responseBody);
					console.log('proxyRes responseBuffer.byteLength: ', responseBuffer.byteLength, " bytes in " + contentEncoding + " encoding");
			
					res.end();
				});
			
				proxyRes.on('error', (error) => {
					console.error(`Error: ${error.message}`);

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

	/**
	 * @description Handles proxy request errors.
	 * @param {Error} error - The error object.
	 */
	onProxyRequestError (error) {
		console.error('proxy request error:', error.message);
	}

	/**
	 * @description Gets the URL object for the current request.
	 * @returns {URL} The URL object.
	 */
	getUrlObject () {
		return new URL("https://" + this.server().hostname() + this.request().url)
	}

	/**
	 * @description Gets the path for the current request.
	 * @returns {string} The request path.
	 */
	getPath () {
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

	/**
	 * @description Gets the file extension of the current path.
	 * @returns {string|undefined} The file extension or undefined if not found.
	 */
	getPathExtension () {
		if (this.path().indexOf(".") !== -1) {
			return this.path().split('.').pop();
		}
		return undefined
	}

	/**
	 * @description Generates a description of the request.
	 * @returns {string} The request description.
	 */
	requestDescription () {
		const request = this.request()
		let s = ""
		const keys = []

		for (let k in request) {
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

	/**
	 * @description Gets the query parameters as a Map.
	 * @returns {Map} The query parameters Map.
	 */
	getQueryMap () {
		const queryMap = new Map()
		const entries = Array.from(this.urlObject().searchParams.entries())
		entries.forEach(entry => { 
			queryMap.set(entry[0], entry[1]);
		})
		return queryMap
	}

	/**
	 * @description Asserts that the path is within the sandbox.
	 * @throws {Error} If the path is outside the sandbox.
	 */
	assertPathInSandbox () {
		const path = this.path()

		const sandboxPath =  process.cwd()
		const normalPath = nodePath.normalize(path)
		const pathRelativeToCwd = nodePath.relative(sandboxPath, normalPath);

		if (pathRelativeToCwd.indexOf("..") !== -1) {
			this.throwCodeAndMessage(401, "error: attempt to access file path '" + path + "' which is outside of sandbox path '" + sandboxPath + "' relative path is '" + pathRelativeToCwd + "'");
		}
	}

	/**
	 * @description Asserts that the path exists.
	 * @throws {Error} If the path does not exist.
	 */
	assertPathExists () {
		const path = this.path();
		if (!fs.existsSync(path)) {
			this.throwCodeAndMessage(404, "404 error: missing file '" + path + "'");
		}
	}

	/**
	 * @description Asserts that the path does not contain dot components.
	 * @throws {Error} If the path contains dot components.
	 */
	assertNonDotPath () {
		const path = this.path();
		const dotComponents = path.split("/").filter(pathComponent => pathComponent.startsWith(".."));

		if (dotComponents.length !== 0) {
			this.throwCodeAndMessage(401, "error: attempt to access file path '" + path + "' which contains a path component begining with a dot.");
		}
	}

	/**
	 * @description Throws an error with a specific code and message.
	 * @param {number} code - The error code.
	 * @param {string} message - The error message.
	 * @throws {Error} The error with the specified code and message.
	 */
	throwCodeAndMessage (code, message) {
		const error = new Error(message);
		error._code = code;
		throw error;
	}

	/**
	 * @description Handles file requests.
	 * @async
	 */
	async onFileRequest () {
		try {
			const path = this.path()

			const ext = this.getPathExtension()

			if (!ext) {
				this.throwCodeAndMessage(401, "  error: no file extension found in path: '" + path + "'");
				return
			}

			let contentType = MimeExtensions.shared().mimeTypeForPathExtension(ext)

			if (!contentType) {
				contentType = "application/octet-stream";
				console.log("  WARNING: no known mime type for extension: '" + ext + "' so we'll assume " + contentType);
			}

			if (path.startsWith(this.localAcmePath())) {
				// we'll allow a read outside of the sandbox for localAcmePath (used for DNS key setup)
			} else {
				this.assertPathInSandbox();
			}

			this.assertPathExists();
			this.assertNonDotPath();

			const header = {
				'Content-Type': contentType,
				'Cache-Control': 'no-cache',
				'Access-Control-Allow-Origin': '*',
			};

			this.response().writeHead(200, header);

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

	/**
	 * @description Streams file content to the response.
	 * @param {string} path - The file path.
	 * @param {Object} response - The response object.
	 * @returns {StrvctHttpsServerRequest} This instance.
	 */
	streamFileContentToResponse (path, response) {
		const readStream = fs.createReadStream(path);
	
		readStream.on('error', (error) => {
			console.error('Error reading file:', error);
			response.writeHead(500, {'Content-Type': 'text/plain'});
			response.end('Error reading file');
		});
	
		readStream.pipe(response);
		return this;
	}

	/**
	 * @description Gets the name for an XHR status code.
	 * @param {number} statusCode - The XHR status code.
	 * @returns {string} The name of the status code.
	 */
	nameForXhrStatusCode (statusCode) {
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

}.initThisClass());