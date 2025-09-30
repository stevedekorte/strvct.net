/**
 * @module WebServer
 */

"use strict";

// Load base dependencies
require("./SvGlobals.js");
require("./Base.js");

// Export main classes
module.exports = {
    Base: require("./Base.js"),
    BaseHttpsServer: require("./BaseHttpsServer.js"),
    BaseHttpsServerRequest: require("./BaseHttpsServerRequest.js"),
    SvMimeExtensions: require("./SvMimeExtensions.js"),
    CliWebServer: require("./CliWebServer.js")
};
