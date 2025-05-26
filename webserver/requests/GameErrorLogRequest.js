/**
 * @module local-web-server
 */

"use strict";

require("../../../../../../Servers/WebServer/getGlobalThis.js");
require("../../../../../../Servers/WebServer/BaseHttpsServerRequest.js");
const fs = require('fs');
const nodePath = require('path');

/**
 * @class GameErrorLogRequest
 * @extends BaseHttpsServerRequest
 * @classdesc Handles error logging from browser clients.
 */
(class GameErrorLogRequest extends BaseHttpsServerRequest {
    
    initPrototypeSlots () {
        super.initPrototypeSlots();
        this.newSlot("logErrorsPath", "logs/errors");
    }
    
    /**
     * Determines if this class can handle the given URL.
     * @param {URL} urlObject - The URL object to check
     * @returns {boolean} True if this class can handle the URL
     */
    static canHandleUrl (urlObject) {
        return urlObject.pathname === "/log_error";
    }
    
    /**
     * Processes the error log request.
     */
    async process () {
        // Call parent to do common setup
        super.process();
        
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
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
                return;
            }
            
            // Ensure the logs directory exists
            const logsPath = nodePath.resolve(this.server().logsPath() || this.logErrorsPath());
            if (!fs.existsSync(logsPath)) {
                fs.mkdirSync(logsPath, { recursive: true });
            }
            
            // Create a timestamp for the filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `error-${timestamp}.json`;
            const filepath = nodePath.join(logsPath, filename);
            
            // Add server timestamp to the error data
            jsonData.serverTimestamp = new Date().toISOString();
            jsonData.userAgent = req.headers['user-agent'];
            jsonData.referer = req.headers['referer'];
            
            // Write the error log
            fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    console.error('Failed to write error log:', err);
                    res.writeHead(500, corsHeaders);
                    res.end(JSON.stringify({ success: false, error: 'Failed to save log' }));
                } else {
                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({ success: true }));
                }
            });
            
        } catch (error) {
            console.error('Error processing log_error request:', error);
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
        }
    }
    
}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = GameErrorLogRequest;
}