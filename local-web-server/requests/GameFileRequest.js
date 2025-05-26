/**
 * @module local-web-server
 */

"use strict";

require("../../../../../../Servers/WebServer/getGlobalThis.js");
require("../../../../../../Servers/WebServer/requests/FileRequest.js");

/**
 * @class GameFileRequest
 * @extends FileRequest
 * @classdesc Handles static file serving for the game server.
 */
(class GameFileRequest extends FileRequest {
    
    // Inherits all functionality from FileRequest
    // Can override methods here for game-specific behavior
    
}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = GameFileRequest;
}