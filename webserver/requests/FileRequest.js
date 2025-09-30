/**
 * @module WebServer
 */

"use strict";

require("../SvGlobals.js");
require("../BaseHttpsServerRequest.js");
require("../SvMimeExtensions.js");
const fs = require("fs");
const nodePath = require("path");

/**
 * @class FileRequest
 * @extends BaseHttpsServerRequest
 * @classdesc Handles static file serving requests with security protections.
 */
(class FileRequest extends BaseHttpsServerRequest {

    initPrototypeSlots () {

        /**
         * @member {string} webRoot - The root directory for serving files
         */
        this.newSlot("webRoot", process.cwd());

        /**
         * @member {Set} blockedExtensions - File extensions that should never be served
         */
        this.newSlot("blockedExtensions", new Set([
            ".env", ".sqlite", ".sqlite3", ".db", ".key", ".pem", ".crt",
            ".config", ".git", ".gitignore", ".npmrc", ".htaccess", ".htpasswd",
            ".bash_history", ".ssh", ".gnupg", ".password", ".passwd", ".shadow"
        ]));

        /**
         * @member {Set} blockedPaths - Path segments that indicate sensitive directories
         */
        this.newSlot("blockedPaths", new Set([
            "node_modules", ".git", ".svn", ".hg", ".env", "config",
            "private", "keys", "certs", "certificates", ".ssh", "secrets"
        ]));
    }

    /**
     * Determines if this class can handle the given URL.
     * @param {URL} urlObject - The URL object to check
     * @returns {boolean} True if this class can handle the URL
     */
    static canHandleUrl (/*urlObject*/) {
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
            if (basename.startsWith(".") && basename !== ".well-known") {
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
        if (requestPath === "/") {
            requestPath = "/index.html";
        }

        // Remove query string from file path
        const questionIndex = requestPath.indexOf("?");
        if (questionIndex > -1) {
            requestPath = requestPath.substring(0, questionIndex);
        }

        // Decode URL encoding (e.g., %20 -> space)
        const decodedPath = decodeURIComponent(requestPath);

        // Normalize the path to prevent directory traversal
        const normalizedPath = nodePath.normalize(decodedPath);

        // Remove leading slash for join
        const relativePath = normalizedPath.startsWith("/")
            ? normalizedPath.substring(1)
            : normalizedPath;

        // Determine what file to serve based on path resolution rules
        this.resolveAndServeFile(relativePath);
    }

    /**
     * Resolves the actual file to serve and serves it.
     * @param {string} relativePath - The relative path from the web root
     */
    resolveAndServeFile (relativePath) {
        // Construct the base file path
        const basePath = nodePath.join(this.webRoot(), relativePath);

        // Validate the base path is safe
        if (!this.isPathSafe(basePath)) {
            this.sendForbidden();
            return;
        }

        // Check if the requested path has an extension
        const hasExtension = nodePath.extname(basePath) !== "";

        if (hasExtension) {
        // Path has extension, serve directly
            this.serveFile(basePath);
        } else {
        // Path has no extension, implement the fallback logic
            this.handlePathWithoutExtension(basePath);
        }
    }

    /**
     * Handles paths without extensions by checking directory/index.html, no extension file, then .html file.
     * @param {string} basePath - The base path without extension
     */
    handlePathWithoutExtension (basePath) {
        // Step 1: Check if it's a directory with index.html
        fs.stat(basePath, (error, stats) => {
            if (!error && stats.isDirectory()) {
            // It's a directory, look for index.html inside
                const indexPath = nodePath.join(basePath, "index.html");

                // Validate the index.html path is safe
                if (!this.isPathSafe(indexPath)) {
                    this.sendForbidden();
                    return;
                }

                fs.access(indexPath, fs.constants.F_OK, (indexError) => {
                    if (!indexError) {
                        // index.html exists in the directory
                        this.serveFile(indexPath);
                    } else {
                        // Directory exists but no index.html - return 404
                        this.sendNotFound();
                    }
                });
                return;
            }

            // Step 2: Check for file without extension
            fs.access(basePath, fs.constants.F_OK, (noExtError) => {
                if (!noExtError) {
                    // File without extension exists
                    this.serveFile(basePath);
                    return;
                }

                // Step 3: Check for file with .html extension
                const htmlPath = basePath + ".html";

                // Validate the .html path is safe
                if (!this.isPathSafe(htmlPath)) {
                    this.sendForbidden();
                    return;
                }

                fs.access(htmlPath, fs.constants.F_OK, (htmlError) => {
                    if (!htmlError) {
                        // File with .html extension exists
                        this.serveFile(htmlPath);
                    } else {
                        // Step 4: Nothing found, return 404
                        this.sendNotFound();
                    }
                });
            });
        });
    }

    /**
     * Serves a file with appropriate content type.
     * @param {string} filePath - The path to the file to serve
     */
    serveFile (filePath) {
        // Get content type
        const extname = nodePath.extname(filePath);
        const contentType =
        SvMimeExtensions.shared().mimeTypeForPathExtension(extname) ||
        "application/octet-stream";

        // Read and serve the file
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === "ENOENT") {
                    this.sendNotFound();
                } else if (error.code === "EACCES" || error.code === "EPERM") {
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
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
        });
        this.response().end("403 Forbidden");
    }

}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = FileRequest;
}
