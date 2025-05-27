/**
 * @module WebServer
 */

"use strict";

// Load base dependencies
require("./getGlobalThis.js");
require("./Base.js");

// Export main classes
module.exports = {
    Base: require("./Base.js"),
    BaseHttpsServer: require("./BaseHttpsServer.js"),
    BaseHttpsServerRequest: require("./BaseHttpsServerRequest.js"),
    MimeExtensions: require("./MimeExtensions.js"),
    CliWebServer: require("./CliWebServer.js")
};