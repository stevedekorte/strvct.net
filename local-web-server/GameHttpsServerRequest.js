/**
 * @module local-web-server
 */

"use strict";

const { BaseHttpsServerRequest, MimeExtensions } = require("../../../../WebServer");
const fs = require('fs');
const nodePath = require('path');
const https = require('https');

/**
 * @class GameHttpsServerRequest
 * @extends BaseHttpsServerRequest
 * @classdesc Game server request handler with error logging and proxy capabilities.
 */
(class GameHttpsServerRequest extends BaseHttpsServerRequest {
    
    initPrototypeSlots () {
        super.initPrototypeSlots();
        
        /**
         * @member {string} logErrorsPath - The path to store error logs.
         */
        this.newSlot("logErrorsPath", "logs/errors");
    }

    /**
     * Determines if this request should be handled as a file request.
     * @param {string} path - The request path.
     * @returns {boolean} True if this should be handled as a file request.
     */
    shouldHandleFileRequest (path) {
        // Handle special API endpoints
        if (path === "/log_error") {
            return false;
        }
        
        // Check if it's a proxy request
        const queryMap = this.getQueryMap();
        if (queryMap.has("proxyUrl")) {
            return false;
        }
        
        return true;
    }

    /**
     * Handles custom requests including API endpoints and proxy requests.
     */
    handleCustomRequest () {
        const path = this.path();
        
        if (path === "/log_error") {
            this.handleLogError();
        } else if (this.getQueryMap().has("proxyUrl")) {
            this.handleProxyRequest();
        } else {
            this.sendNotFound();
        }
    }

    /**
     * @description Handles the log_error API endpoint.
     */
    async handleLogError () {
        const req = this.request();
        const res = this.response();
        
        // Set CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };
        
        // Handle OPTIONS request for CORS preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(200, corsHeaders);
            res.end();
            return;
        }
        
        // Only accept POST requests
        if (req.method !== 'POST') {
            res.writeHead(405, corsHeaders);
            res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
            return;
        }
        
        try {
            const body = await this.readBody();
            let jsonData;
            
            try {
                jsonData = JSON.parse(body);
            } catch (parseError) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ 
                    success: false, 
                    error: "Invalid JSON: " + parseError.message
                }));
                return;
            }
            
            // Ensure logs directory exists
            const logsDir = this.logErrorsPath();
            try {
                if (!fs.existsSync(logsDir)) {
                    this.log(`Creating logs directory: ${logsDir}`);
                    fs.mkdirSync(logsDir, { recursive: true });
                }
            } catch (dirError) {
                this.log("Error creating logs directory:", dirError.message);
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ 
                    success: false, 
                    error: "Failed to create logs directory: " + dirError.message 
                }));
                return;
            }
            
            // Format date and time for filename: YYYY_MM_DD_HHMMSS
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const randomId = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            
            // Create filename with fixed length
            const filename = `${year}_${month}_${day}_${hours}${minutes}${seconds}_${randomId}.json`;
            const filePath = nodePath.join(logsDir, filename);
            
            // Write the JSON data to file
            try {
                fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
                this.log(`Successfully wrote error log to ${filePath}`);
            } catch (writeError) {
                this.log("Error writing log file:", writeError.message);
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ 
                    success: false, 
                    error: "Failed to write log file: " + writeError.message 
                }));
                return;
            }
            
            // Send success response
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify({ 
                success: true, 
                message: 'Error logged successfully',
                filename: filename
            }));
            
        } catch (error) {
            this.log('Error handling log_error request:', error.message);
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({ success: false, error: 'Internal server error: ' + error.message }));
        }
    }

    /**
     * @description Handles proxy requests.
     */
    handleProxyRequest () {
        try {
            const req = this.request();
            const res = this.response();
            const url = this.queryMap().get("proxyUrl");
            
            if (!url) {
                res.statusCode = 400;
                res.end('Bad Request: Missing proxyUrl parameter');
                return;
            }
            
            this.log("PROXY: " + url);
            const urlParsed = new URL(url);
            const hostname = urlParsed.hostname;
            const path = urlParsed.pathname + urlParsed.search;
            
            const options = {
                hostname: hostname,
                port: 443,
                path: path,
                method: req.method,
                headers: {...req.headers}
            };
            
            // Remove unnecessary headers
            const unneededHeaderKeys = [
                "connection",
                "host",
                "user-agent",
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
                headers['Access-Control-Allow-Origin'] = '*';
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                
                proxyRes.on('data', (chunk) => {
                    responseBody.push(chunk);
                    res.write(chunk);
                });
    
                proxyRes.on('end', () => {
                    const responseBuffer = Buffer.concat(responseBody);
                    this.log("PROXY RESPONSE: " + responseBuffer.byteLength + " bytes");
                    res.end();
                });
            
                proxyRes.on('error', (error) => {
                    console.error(`Error: ${error.message}`);
                    const errorMessage = "proxy request error: '" + error.message + "'";
                    this.log(errorMessage);
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
                        const isText = contentType.startsWith('text') || 
                                      contentType.startsWith('application/json') || 
                                      contentType.startsWith('application/javascript');
                        if (isText) {
                            this.log("  request body is text of " + Buffer.concat(reqBodyParts).byteLength + " bytes");
                        } else {
                            this.log("  request body is binary of " + Buffer.concat(reqBodyParts).byteLength + " bytes");
                        }
                    }
                }
            });
            
        } catch (e) {
            this.onProxyRequestError(e);
        }
    }

    /**
     * @description Handles proxy request errors.
     * @param {Error} error - The error object.
     */
    onProxyRequestError (error) {
        this.log('proxy request error:', error.message);
        this.response().statusCode = 500;
        this.response().end('Internal Server Error');
    }

    /**
     * @description Gets the path from the URL object.
     * @returns {string} The path.
     */
    getPath () {
        let path = nodePath.join(".", decodeURI(this.urlObject().pathname));
        if (path === "./") {
            path = "./index.html";
        }

        // Handle API endpoints like log_error
        if (path === "./log_error") {
            return "/log_error";
        }

        const acmePath = ".well-known/acme-challenge/";
        if (path.startsWith(acmePath)) {
            path = path.replace(acmePath, this.localAcmePath());
        }
        
        // Silently ignore Chrome DevTools specific requests
        if (path.includes(".well-known/appspecific/com.chrome.devtools.json")) {
            // Return a special path to handle later
            return "chrome-devtools-json";
        }

        return path;
    }

    /**
     * @description Handles file requests with special handling for Chrome DevTools.
     */
    handleFileRequest () {
        // Special handling for Chrome DevTools requests
        if (this.path() === "chrome-devtools-json") {
            this.response().writeHead(404);
            this.response().end();
            return;
        }
        
        super.handleFileRequest();
    }

}).initThisClass();

module.exports = GameHttpsServerRequest;