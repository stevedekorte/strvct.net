/**
 * @module WebServer
 */

"use strict";

require("../getGlobalThis.js");
require("../BaseHttpsServerRequest.js");
require("../MimeExtensions.js");
const fs = require('fs');
const nodePath = require('path');

/**
 * @class FileRequest
 * @extends BaseHttpsServerRequest
 * @classdesc Handles static file serving requests with security protections.
 */
(class FileRequest extends BaseHttpsServerRequest {
    
    initPrototypeSlots () {
        super.initPrototypeSlots();
        
        /**
         * @member {string} webRoot - The root directory for serving files
         */
        this.newSlot("webRoot", process.cwd());
        
        /**
         * @member {Set} blockedExtensions - File extensions that should never be served
         */
        this.newSlot("blockedExtensions", new Set([
            '.env', '.sqlite', '.sqlite3', '.db', '.key', '.pem', '.crt',
            '.config', '.git', '.gitignore', '.npmrc', '.htaccess', '.htpasswd',
            '.bash_history', '.ssh', '.gnupg', '.password', '.passwd', '.shadow'
        ]));
        
        /**
         * @member {Set} blockedPaths - Path segments that indicate sensitive directories
         */
        this.newSlot("blockedPaths", new Set([
            'node_modules', '.git', '.svn', '.hg', '.env', 'config',
            'private', 'keys', 'certs', 'certificates', '.ssh', 'secrets'
        ]));
    }
    
    /**
     * Determines if this class can handle the given URL.
     * @param {URL} urlObject - The URL object to check
     * @returns {boolean} True if this class can handle the URL
     */
    static canHandleUrl (urlObject) {
        // Handle all requests that weren't handled by other classes
        return true;
    }
    
    /**
     * Validates if a file path is safe to serve.
     * @param {string} filePath - The file path to validate
     * @returns {boolean} True if the path is safe
     */
    isPathSafe (filePath) {
        try {
            // Resolve to absolute path
            const resolvedPath = nodePath.resolve(filePath);
            const webRootPath = nodePath.resolve(this.webRoot());
            
            // Check if the resolved path is within the web root
            if (!resolvedPath.startsWith(webRootPath)) {
                console.warn(`FileRequest: Attempted directory traversal: ${filePath} -> ${resolvedPath}`);
                return false;
            }
            
            // Check for blocked extensions
            const ext = nodePath.extname(resolvedPath).toLowerCase();
            if (this.blockedExtensions().has(ext)) {
                console.warn(`FileRequest: Blocked file extension: ${ext}`);
                return false;
            }
            
            // Check for blocked path segments
            const pathSegments = resolvedPath.split(nodePath.sep);
            for (const segment of pathSegments) {
                if (this.blockedPaths().has(segment.toLowerCase())) {
                    console.warn(`FileRequest: Blocked path segment: ${segment}`);
                    return false;
                }
            }
            
            // Check for hidden files (starting with .)
            const basename = nodePath.basename(resolvedPath);
            if (basename.startsWith('.') && basename !== '.well-known') {
                console.warn(`FileRequest: Blocked hidden file: ${basename}`);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error(`FileRequest: Error validating path: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Processes the file request.
     */
    process () {
        // Call parent to do common setup first
        super.process();
        
        // Get the requested path
        let requestPath = this.path();
        if (requestPath === '/') {
            requestPath = '/index.html';
        }
        
        // Remove query string from file path
        const questionIndex = requestPath.indexOf('?');
        if (questionIndex > -1) {
            requestPath = requestPath.substring(0, questionIndex);
        }
        
        // Decode URL encoding (e.g., %20 -> space)
        const decodedPath = decodeURIComponent(requestPath);
        
        // Normalize the path to prevent directory traversal
        const normalizedPath = nodePath.normalize(decodedPath);
        
        // Remove leading slash for join
        const relativePath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
        
        // Construct the full file path
        const filePath = nodePath.join(this.webRoot(), relativePath);
        
        // Validate the path is safe
        if (!this.isPathSafe(filePath)) {
            this.sendForbidden();
            return;
        }
        
        // Get content type
        const extname = nodePath.extname(filePath);
        const contentType = MimeExtensions.shared().mimeTypeForPathExtension(extname) || 'application/octet-stream';
        
        // Read and serve the file
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    this.sendNotFound();
                } else if (error.code === 'EACCES' || error.code === 'EPERM') {
                    this.sendForbidden();
                } else {
                    console.error(`FileRequest: Error reading file ${filePath}:`, error);
                    this.sendServerError();
                }
            } else {
                this.sendFileContent(content, contentType);
            }
        });
    }
    
    /**
     * Sends a 403 Forbidden response.
     */
    sendForbidden () {
        this.response().writeHead(403, { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        this.response().end('403 Forbidden');
    }
    
}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = FileRequest;
}