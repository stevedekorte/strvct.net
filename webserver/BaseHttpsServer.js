/**
 * @module WebServer
 */

"use strict";

require("./getGlobalThis.js");
require("./Base.js");
require("./BaseHttpsServerRequest.js");

const https = require('https');
const http = require('http');
const fs = require('fs');
const nodePath = require('path');

/**
 * @class BaseHttpsServer
 * @extends Base
 * @classdesc Base HTTPS server with optional HTTP support. Subclasses should override serverName() and customize behavior.
 * 
 * REDESIGN NOTES:
 * - Remove the need for server subclasses (GameHttpsServer, AccountHttpsServer)
 * - Add support for --config command line argument that points to a JSON configuration file
 * - Config file format:
 *   {
 *     "serverName": "MyServer",
 *     "requestClasses": [
 *       "./requests/AcmeChallengeRequest.js",
 *       "./requests/FileRequest.js"
 *     ]
 *   }
 * - The server infers the class name from the filename (e.g., "FileRequest" from "FileRequest.js")
 * - Load and evaluate the JS files for request classes (if not already loaded)
 * - When handling requests, iterate through loaded request classes in order
 * - Call static method canHandleUrl(urlObject) on each class
 * - First class that returns true handles the request
 * - Remove requestClass() and newRequestHandler() methods
 */
(class BaseHttpsServer extends Base {
    
    /**
     * Initializes the prototype slots for the BaseHttpsServer.
     */
    initPrototypeSlots () {
        /**
         * @member {Object} server - The server instance.
         */
        this.newSlot("server", null);

        /**
         * @member {string} hostname - The hostname for the server.
         */
        this.newSlot("hostname", "localhost");

        /**
         * @member {number} port - The port number for the server.
         */
        this.newSlot("port", null);

        /**
         * @member {string} keyPath - The path to the server key file.
         */
        this.newSlot("keyPath", null);

        /**
         * @member {string} certPath - The path to the server certificate file.
         */
        this.newSlot("certPath", null);

        /**
         * @member {boolean} isSecure - Indicates whether the server should use HTTPS.
         */
        this.newSlot("isSecure", true);
        
        /**
         * @member {string} configPath - Path to the JSON configuration file.
         */
        this.newSlot("configPath", null);
        
        /**
         * @member {Array} requestClasses - Array of loaded request handler classes.
         */
        this.newSlot("requestClasses", []);
        
        /**
         * @member {string} serverName - The name of the server for logging.
         */
        this.newSlot("serverName", "BaseServer");
        
        /**
         * @member {string} logsPath - The path where log files should be stored.
         */
        this.newSlot("logsPath", null);
        
        /**
         * @member {Object} config - Parsed configuration object.
         * @description This contains the request classes and the server name, and can be used for other things in the future.
         * Request classes can access the config object via this.server().config();
         */
        this.newSlot("config", null);
    }
  
    /**
     * Initializes the prototype.
     */
    initPrototype () {
    }

    /**
     * Returns the server name. Can be set via config or overridden by subclasses.
     * @returns {string} The server name.
     */
    // serverName getter is automatically created by newSlot()

    /**
     * Initializes the BaseHttpsServer instance.
     * @returns {BaseHttpsServer} The initialized instance.
     */
    init () {
        super.init();
        this.setPort(8000);
        // Default key paths - subclasses may override
        this.setKeyPath(nodePath.join(__dirname, 'keys/server.key'));
        this.setCertPath(nodePath.join(__dirname, 'keys/server.crt'));
        return this;
    }
    
    /**
     * Returns the options for creating an HTTPS server.
     * @returns {Object} The server options.
     */
    options () {
        return {
            key: fs.readFileSync(this.keyPath()),
            cert: fs.readFileSync(this.certPath())
        };
    }

    /**
     * Returns the protocol being used by the server.
     * @returns {string} The protocol ("https" or "http").
     */
    protocol () {
        return this.isSecure() ? "https" : "http";
    }
    
    /**
     * Returns the server's URL.
     * @returns {string} The server URL.
     */
    url () {
        return this.protocol() + "://" + this.hostname() + ":" + this.port();
    }

    /**
     * Creates a new request handler instance. Subclasses should override to return their custom request class.
     * @returns {BaseHttpsServerRequest} A new request handler instance.
     */
    newRequestHandler () {
        const requestClass = this.requestClass();
        return new requestClass().setServer(this);
    }

    /**
     * Returns the request handler class. Subclasses should override this.
     * @returns {typeof BaseHttpsServerRequest} The request handler class.
     */
    requestClass () {
        return BaseHttpsServerRequest;
    }

    /**
     * Runs the server.
     */
    run () {
        // Load configuration if configPath is set
        if (this.configPath()) {
            this.loadConfiguration();
        }
        
        const createServerMethod = this.isSecure() ? https.createServer : http.createServer;
        const serverOptions = this.isSecure() ? this.options() : {};
        
        const server = this.isSecure() 
            ? createServerMethod(serverOptions, (request, response) => this.onRequest(request, response))
            : createServerMethod((request, response) => this.onRequest(request, response));
            
        this.setServer(server);
        
        server.listen(this.port(), () => {
            console.log(this.serverName() + ' is running at ' + this.url());
        });
    }
    
    /**
     * Loads the configuration file and request handler classes.
     */
    loadConfiguration () {
        console.log(this.serverName() + ": Loading configuration from " + this.configPath());
        
        const configData = fs.readFileSync(this.configPath(), 'utf8');
        const config = JSON.parse(configData);
        this.setConfig(config);
        
        // Set server name from config if provided and not overridden by CLI
        if (config.serverName && this.serverName() === "BaseServer") {
            this.setServerName(config.serverName);
        }
        
        const requestClasses = [];
        if (config.requestClasses) {
            for (const classInfo of config.requestClasses) {
                // Handle both formats: object with path or just a path string
                const classPath = typeof classInfo === 'string' ? classInfo : classInfo.path;
                const requestClass = this.loadRequestClass(classInfo);
                
                if (requestClass) {
                    requestClasses.push(requestClass);
                    // Get class name from path if not specified
                    const className = classInfo.className || nodePath.basename(classPath, '.js');
                    console.log(this.serverName() + ": Loaded request handler: " + className);
                }
            }
        }
        this.setRequestClasses(requestClasses);
    }
    
    /**
     * Loads a single request class from the given class info.
     * @param {Object|string} classInfo - Either an object with path property or a path string
     * @returns {Class} The loaded class or null if already loaded
     */
    loadRequestClass (classInfo) {
        // Get class path - either from object or directly if string was provided
        const classPath = typeof classInfo === 'string' ? classInfo : classInfo.path;
        
        // Extract className from the filename (remove path and extension)
        const fileName = nodePath.basename(classPath, '.js');
        const className = classInfo.className || fileName;
        
        // Check if class is already loaded
        if (getGlobalThis()[className]) {
            return getGlobalThis()[className];
        }
        
        // Resolve the path relative to the config file directory
        const configDir = nodePath.dirname(this.configPath());
        const fullPath = nodePath.resolve(configDir, classPath);
        
        // Load the module using require instead of eval for better error handling
        try {
            require(fullPath);
            const RequestClass = getGlobalThis()[className];
            
            if (!RequestClass) {
                throw new Error(`Class ${className} not found in ${fullPath}. Make sure the class name matches the filename.`);
            }
            
            // Return the class (actual initialization will be handled by CliWebServer)
            return RequestClass;
        } catch (error) {
            console.error(this.serverName() + ": Failed to load " + className + " from " + fullPath + ":", error.message);
            return null;
        }
    }

    /**
     * Handles incoming requests.
     * @param {Object} request - The request object.
     * @param {Object} response - The response object.
     */
    onRequest (request, response) {
        // If using new config-based routing
        if (this.requestClasses().length > 0) {
            this.handleRequestWithClasses(request, response);
        } else {
            // Fall back to old method for backward compatibility
            const handler = this.newRequestHandler();
            handler.setRequest(request);
            handler.setResponse(response);
            handler.process();
        }
    }
    
    /**
     * Handles a request using the configured request classes.
     * @param {Object} request - The request object.
     * @param {Object} response - The response object.
     */
    handleRequestWithClasses (request, response) {
        try {
            // Handle OPTIONS requests for CORS
            if (request.method === 'OPTIONS') {
                const headers = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                    'Content-Length': '0'
                };
                response.writeHead(200, headers);
                response.end();
                return;
            }
            
            // Parse the URL
            const urlObject = new URL(request.url, `${this.protocol()}://${request.headers.host || this.hostname()}`);
            
            // Find the first request class that can handle this URL
            for (const RequestClass of this.requestClasses()) {
                if (RequestClass.canHandleUrl && RequestClass.canHandleUrl(urlObject)) {
                    // Create and configure the handler
                    const handler = new RequestClass();
                    handler.setServer(this);
                    handler.setRequest(request);
                    handler.setResponse(response);
                    
                    // Process the request
                    handler.process();
                    return;
                }
            }
            
            // No handler found - send 404
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('Not Found');
            
        } catch (error) {
            console.error(this.serverName() + ": Request handling error:", error);
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('Internal Server Error');
        }
    }

}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = BaseHttpsServer;
}