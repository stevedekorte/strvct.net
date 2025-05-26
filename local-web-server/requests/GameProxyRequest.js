/**
 * @module local-web-server
 */

"use strict";

require("../../../../../../Servers/WebServer/getGlobalThis.js");
require("../../../../../../Servers/WebServer/BaseHttpsServerRequest.js");
const https = require('https');
const http = require('http');

/**
 * @class GameProxyRequest
 * @extends BaseHttpsServerRequest
 * @classdesc Handles proxy requests for the game server.
 */
(class GameProxyRequest extends BaseHttpsServerRequest {
    
    /**
     * Determines if this class can handle the given URL.
     * @param {URL} urlObject - The URL object to check
     * @returns {boolean} True if this class can handle the URL
     */
    static canHandleUrl (urlObject) {
        return urlObject.searchParams.has("proxyUrl");
    }
    
    /**
     * Processes the proxy request.
     */
    async process () {
        // Call parent to do common setup
        super.process();
        
        try {
            const req = this.request();
            const res = this.response();
            
            const url = this.queryMap().get("proxyUrl");
            if (!url) {
                res.statusCode = 400;
                res.end('Bad Request');
                return;
            }
            
            this.log("PROXY: " + url);
            
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname;
            const path = parsedUrl.pathname + parsedUrl.search;
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: path,
                method: req.method,
                headers: {...req.headers}
            };
            
            // Remove headers that shouldn't be forwarded
            delete options.headers['host'];
            delete options.headers['connection'];
            
            const proxyReq = protocol.request(options, (proxyRes) => {
                const headers = proxyRes.headers;
                
                // Add CORS headers
                headers['Access-Control-Allow-Origin'] = '*';
                
                res.writeHead(proxyRes.statusCode, headers);
                proxyRes.pipe(res);
            });
            
            proxyReq.on('error', (error) => {
                console.error(`Proxy Error: ${error.message}`);
                res.statusCode = 500;
                res.end('Proxy Error');
            });
            
            req.pipe(proxyReq);
            
        } catch (e) {
            this.onProxyRequestError(e);
        }
    }
    
    /**
     * Handles proxy request errors.
     * @param {Error} error - The error object.
     */
    onProxyRequestError (error) {
        this.log('proxy request error:', error.message);
        this.response().statusCode = 500;
        this.response().end('Internal Server Error');
    }
    
}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = GameProxyRequest;
}