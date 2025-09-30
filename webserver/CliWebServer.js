#!/usr/bin/env node
/**
 * @module WebServer
 *
 * This file can be run directly from the command line:
 * ./CliWebServer.js --config /path/to/config.json [--port 8080] [--secure true|false]
 *
 * It provides a simple way to launch any server with a configuration file.
 */

"use strict";

require("./SvGlobals.js");
require("./Base.js");
const BaseHttpsServer = require("./BaseHttpsServer.js");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const nodePath = require("path");

/**
 * @class CliWebServer
 * @extends Base
 * @classdesc A utility class for setting up a BaseHttpsServer instance with command line arguments
 */
(class CliWebServer extends Base {

    /**
     * Initializes the prototype slots.
     */
    initPrototypeSlots () {
        /**
         * @member {BaseHttpsServer} server - The server instance.
         */
        this.newSlot("server", null);

        /**
         * @member {Object} args - The parsed command line arguments.
         */
        this.newSlot("args", null);

        /**
         * @member {string} defaultConfigPath - The default path to the server configuration file.
         */
        this.newSlot("defaultConfigPath", null);

        /**
         * @member {function[]} initializeCallbacks - Array of initialization callbacks to run before server start.
         */
        this.newSlot("initializeCallbacks", []);
    }

    /**
     * Initializes the instance.
     * @returns {CliWebServer} The initialized instance.
     */
    init () {
        super.init();
        this.setServer(BaseHttpsServer.clone());
        this.setInitializeCallbacks([]);
        return this;
    }

    /**
     * Adds an initialization function to be called before server start.
     * @param {function} callback - The initialization function.
     * @returns {CliWebServer} This instance for chaining.
     */
    addInitializeCallback (callback) {
        this.initializeCallbacks().push(callback);
        return this;
    }

    /**
     * Parses command line arguments.
     * @returns {Object} The parsed arguments.
     */
    parseArgs () {
        const argv = yargs(hideBin(process.argv)).options({
            port: { type: "number", demandOption: false, describe: "Port number" },
            key: { type: "string", demandOption: false, describe: "Key file path" },
            cert: { type: "string", demandOption: false, describe: "Cert file path" },
            secure: { type: "boolean", demandOption: false, default: true, describe: "Is secure (set to true for HTTPS, false for HTTP)" },
            logsPath: { type: "string", demandOption: false, describe: "Path to store error logs" },
            name: { type: "string", demandOption: false, describe: "Server name for logging" },
            config: { type: "string", demandOption: false, describe: "Path to server configuration file" }
        }).help().argv;

        this.setArgs(argv);
        return argv;
    }

    /**
     * Configures the server based on command line arguments.
     * @returns {CliWebServer} This instance for chaining.
     */
    configureServer () {
        const argv = this.args() || this.parseArgs();
        const server = this.server();

        // Set config path
        const configPath = argv.config || this.defaultConfigPath();
        if (configPath) {
            server.setConfigPath(configPath);
        }

        // Apply command line arguments
        if (argv.port) {
            server.setPort(argv.port);
        }

        if (argv.cert) {
            server.setCertPath(argv.cert);
        }

        if (argv.key) {
            server.setKeyPath(argv.key);
        }

        if (argv.name) {
            server.setServerName(argv.name);
        }

        if (argv.logsPath) {
            server.setLogsPath(argv.logsPath);
        }

        server.setIsSecure(argv.secure);

        return this;
    }

    /**
     * Sets up error handling for the process.
     */
    setupErrorHandling () {
        // Set up global error handlers
        process.on("unhandledRejection", (reason, promise) => {
            console.error(`${this.server().serverName()}: Unhandled Rejection at:`, promise, "reason:", reason);
            console.error("Stack trace:", reason.stack);
        });

        process.on("uncaughtException", (error) => {
            console.error(`${this.server().serverName()}: Uncaught Exception:`, error);
            console.error("Stack trace:");
            console.error(error.stack);
        });
    }

    /**
     * Loads the server configuration and initializes request classes.
     */
    async prepareServer () {
        try {
            const server = this.server();
            // Load configuration if not already loaded
            if (server.configPath() && !server.config()) {
                console.log(`${server.serverName()}: Loading configuration from ${server.configPath()}`);

                // Load the configuration directly instead of using server.loadConfiguration()
                // to avoid double-loading later
                const fs = require("fs");
                const nodePath = require("path");

                const configData = fs.readFileSync(server.configPath(), "utf8");
                const config = JSON.parse(configData);
                server.setConfig(config);

                // Set server name from config if provided and not overridden by CLI
                if (config.serverName && server.serverName() === "BaseServer") {
                    server.setServerName(config.serverName);
                }

                const requestClasses = [];
                if (config.requestClasses) {
                    for (const classInfo of config.requestClasses) {
                        const requestClass = server.loadRequestClass(classInfo);
                        if (requestClass) {
                            requestClasses.push(requestClass);
                            console.log(`${server.serverName()}: Loaded request handler: ${classInfo.className}`);
                        }
                    }
                }
                server.setRequestClasses(requestClasses);
            }

            // Call prepareToUse on each request class
            if (server.requestClasses().length > 0) {
                for (const RequestClass of server.requestClasses()) {
                    if (typeof RequestClass.prepareToUse === "function") {
                        console.log(`${server.serverName()}: Preparing ${RequestClass.name}...`);
                        await RequestClass.prepareToUse(server);
                    }
                }
            }

            // Run any additional initialization callbacks
            for (const callback of this.initializeCallbacks()) {
                await callback(server);
            }
        } catch (error) {
            console.error(`${this.server().serverName()}: Error preparing server:`, error);
            throw error;
        }
    }

    /**
     * Starts the server.
     */
    async start () {
        try {
            this.setupErrorHandling();

            // Prepare the server (load config, initialize request classes)
            await this.prepareServer();

            // Start the server
            // Note: We don't need to call loadConfiguration again since it's already loaded in prepareServer
            const server = this.server();
            const options = server.isSecure() ? server.options() : {};
            const createServerMethod = server.isSecure() ? require("https").createServer : require("http").createServer;

            const httpServer = server.isSecure()
                ? createServerMethod(options, (request, response) => server.onRequest(request, response))
                : createServerMethod((request, response) => server.onRequest(request, response));

            server.setServer(httpServer);

            httpServer.listen(server.port(), () => {
                console.log(`${server.serverName()}: Server is running at ${server.url()}`);
            });
        } catch (error) {
            console.error(`${this.server().serverName()}: Failed to start server:`, error);
            process.exit(1);
        }
    }

}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = CliWebServer;
}

// If this file is being run directly (not imported as a module)
if (require.main === module) {
    // This code executes when the file is run directly from the command line
    // Usage examples:
    //   ./CliWebServer.js --config /path/to/config.json --port 8080
    //   ./CliWebServer.js --config ../AccountServer/webserver/config/config.json --port 8001
    //   ./CliWebServer.js --help

    const cliServer = CliWebServer.clone();

    // Parse command line arguments
    cliServer.parseArgs();

    // Configure server
    cliServer.configureServer();

    // Start the server
    cliServer.start();
}
