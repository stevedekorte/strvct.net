/**
 * @module WebServer
 */

"use strict";

/**
 * @class BaseHttpsServerRequest
 * @extends Base
 * @classdesc Base class for handling HTTPS server requests, including file and proxy requests.
 * 
 * REDESIGN NOTES:
 * - This class will become the base class for all request handlers
 * - Remove handleAcmeChallenge() and handleFileRequest() methods
 * - Create separate classes:
 *   - AcmeChallengeRequest - handles /.well-known/acme-challenge/ paths
 *   - FileRequest - handles static file serving
 * - Each subclass will implement:
 *   - static canHandleUrl(urlObject) - returns true if can handle
 *   - process() - handles the request
 * - Keep common functionality in base class:
 *   - URL parsing
 *   - Query parameter handling
 *   - Response helpers (sendJson, sendNotFound, etc.)
 *   - Body reading
 *   - Error handling

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

require("./SvGlobals.js");
require("./Base.js");
require("./MimeExtensions.js");
const fs = require('fs');
const nodePath = require('path');
//const https = require('https');
//const http = require('http');
//const url = require('url');

/**
 * @class BaseHttpsServerRequest
 * @extends Base
 * @classdesc Base class for handling HTTPS server requests.
 */
(class BaseHttpsServerRequest extends Base {
    
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
     * Returns the log prefix for this request.
     * @returns {string} The log prefix.
     */
    logPrefix () {
        return "[" + this.server().serverName() + "] ";
    }

    /**
     * @description Processes the incoming request.
     * In base class, this just does common setup.
     * Subclasses should override to implement their specific handling.
     */
    process () {
        this.log(this.request().url);
        this.setUrlObject(this.getUrlObject());
        
        const path = this.getPath();
        this.setPath(path);
        
        // Set query map
        this.setQueryMap(this.getQueryMap());
        
        // Subclasses should override this method to handle the request
        // Don't send a response here - let subclasses handle it
    }

    /**
     * Determines if this request should be handled as a file request.
     * Subclasses can override this to implement custom routing.
     * @param {string} path - The request path.
     * @returns {boolean} True if this should be handled as a file request.
     */
    shouldHandleFileRequest (/*path*/) {
        return true;
    }

    /**
     * Handles custom requests. Subclasses should override this for custom functionality.
     */
    handleCustomRequest () {
        this.sendNotFound();
    }

    /**
     * @description Handles ACME challenge requests.
     */
    handleAcmeChallenge () {
        const urlPath = this.urlObject().pathname;
        const localPath = this.localAcmePath() + urlPath.substring("/.well-known/acme-challenge/".length);
        
        fs.readFile(localPath, (error, data) => {
            if (error) {
                this.sendNotFound();
            } else {
                this.response().writeHead(200, { 'Content-Type': 'text/plain' });
                this.response().end(data);
            }
        });
    }

    /**
     * @description Gets the URL object from the request.
     * @returns {URL} The URL object.
     */
    getUrlObject () {
        return new URL(this.request().url, `${this.server().protocol()}://${this.request().headers.host}`);
    }

    /**
     * @description Gets the path from the URL object.
     * @returns {string} The path.
     */
    getPath () {
        return this.urlObject().pathname;
    }

    /**
     * @description Gets the query map from the URL object.
     * @returns {Map} The query map.
     */
    getQueryMap () {
        const searchParams = this.urlObject().searchParams;
        const map = new Map();
        for (const [key, value] of searchParams) {
            map.set(key, value);
        }
        return map;
    }

    /**
     * @description Handles file requests.
     */
    handleFileRequest () {
        let filePath = '.' + this.request().url;
        if (filePath === './') {
            filePath = './index.html';
        }

        const extname = nodePath.extname(filePath);
        const contentType = MimeExtensions.shared().mimeTypeForPathExtension(extname) || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    this.sendNotFound();
                } else {
                    this.sendServerError();
                }
            } else {
                this.sendFileContent(content, contentType);
            }
        });
    }

    /**
     * Sends file content with appropriate headers.
     * @param {Buffer} content - The file content.
     * @param {string} contentType - The content type.
     */
    sendFileContent (content, contentType) {
        const headers = {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
        
        if (this.server().isSecure()) {
            headers['Strict-Transport-Security'] = 'max-age=86400; includeSubDomains';
        }
        
        this.response().writeHead(200, headers);
        this.response().end(content, 'utf-8');
    }

    /**
     * @description Sends a 404 Not Found response.
     */
    sendNotFound () {
        this.response().writeHead(404, { 'Content-Type': 'text/html' });
        this.response().end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>404 Not Found</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #333; }
                </style>
            </head>
            <body>
                <h1>404 - Page Not Found</h1>
                <p>The requested resource could not be found.</p>
            </body>
            </html>
        `, 'utf-8');
    }

    /**
     * @description Sends a 500 Internal Server Error response.
     */
    sendServerError () {
        this.response().writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        this.response().end(JSON.stringify({ 
            error: 'Internal Server Error' 
        }));
    }

    /**
     * @description Logs a message with the server prefix.
     * @param {string} message - The message to log.
     */
    log (message) {
        console.log(this.logPrefix() + message);
    }

    /**
     * @description Logs an error with the server prefix.
     * @param {string} message - The error message to log.
     */
    error (message) {
        console.error(this.logPrefix() + message);
    }

    /**
     * Reads the request body and returns it as a string.
     * @returns {Promise<string>} The request body.
     */
    async readBody () {
        return new Promise((resolve, reject) => {
            let data = '';
            this.request().on('data', chunk => {
                data += chunk;
            });
            this.request().on('end', () => {
                resolve(data);
            });
            this.request().on('error', reject);
        });
    }

    /**
     * Reads the request body and parses it as JSON.
     * @returns {Promise<Object>} The parsed JSON body.
     */
    async readJsonBody () {
        const body = await this.readBody();
        try {
            return JSON.parse(body);
        } catch (e) {
            throw new Error('Invalid JSON in request body ' + e.message);
        }
    }

    /**
     * Sends a JSON response.
     * @param {Object} data - The data to send.
     * @param {number} [statusCode=200] - The HTTP status code.
     */
    sendJson (data, statusCode = 200) {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };
        this.response().writeHead(statusCode, headers);
        this.response().end(JSON.stringify(data));
    }

}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = BaseHttpsServerRequest;
}