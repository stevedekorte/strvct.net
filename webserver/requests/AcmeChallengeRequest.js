/**
 * @module WebServer
 */

"use strict";

require("../SvGlobals.js");
require("../BaseHttpsServerRequest.js");
const fs = require("fs");
const nodePath = require("path");

/**
 * @class AcmeChallengeRequest
 * @extends BaseHttpsServerRequest
 * @classdesc Handles ACME challenge requests for SSL certificate validation.
 */
(class AcmeChallengeRequest extends BaseHttpsServerRequest {

    /**
     * Determines if this class can handle the given URL.
     * @param {URL} urlObject - The URL object to check
     * @returns {boolean} True if this class can handle the URL
     */
    static canHandleUrl (urlObject) {
        return urlObject.pathname.startsWith("/.well-known/acme-challenge/");
    }

    /**
     * Processes the ACME challenge request.
     */
    process () {
        // Call parent to do common setup
        super.process();

        const path = this.path();
        const filename = nodePath.basename(path);
        const acmeFilePath = nodePath.join(this.localAcmePath(), filename);

        fs.readFile(acmeFilePath, (error, content) => {
            if (error) {
                if (error.code === "ENOENT") {
                    this.sendNotFound();
                } else {
                    this.sendServerError();
                }
            } else {
                this.response().writeHead(200, { "Content-Type": "text/plain" });
                this.response().end(content, "utf-8");
            }
        });
    }

}).initThisClass();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = AcmeChallengeRequest;
}
