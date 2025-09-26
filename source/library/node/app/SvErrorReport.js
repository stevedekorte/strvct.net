"use strict";

/**
 * @module library.node
 */

/**
 * @class SvErrorReport
 * @extends TitledNode
 * @classdesc A class for reporting errors to the server.
 * 
 * Example:
 * 
 * // quick send
 * await SvErrorReport.asyncSend(new Error("Test error message"));
 * 
 * // detailed send
 * const errorReport = SvErrorReport.clone();
 * errorReport.setError(new Error("Test error message"));
 * errorReport.setJson({ isTest: true, testTime: Date.now(), component: "ErrorReportingSystem" });
 * await errorReport.asyncSend();
 * 
 */

(class SvErrorReport extends TitledNode {

    static async asyncSend (error, additionalJson = null) {
        const errorReport = SvErrorReport.clone();
        errorReport.setError(error);
        errorReport.setAdditionalJson(additionalJson);
        return await errorReport.asyncSend();
    }

    /**
     * Test method to verify error reporting functionality
     * @param {string} [message="Test error message"] - Test error message
     * @returns {Promise<Object>} - Server response
     * @category Error Handling
     */
    static async test () {
        console.log("Sending test error report");        
        return await SvErrorReport.asyncSend(new Error("Test error message"), { foo: "bar" });
    }

    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }

        {
            const slot = this.newSlot("additionalJson", null);
            slot.setSlotType("JSON Object");
        }

        {
            const slot = this.newSlot("bodyJson", null);
            slot.setSlotType("JSON Object");
        }

    }
  
    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
        this.setIsDebugging(true);
    }

    /**
     * @description Initializes the instance
     * @category Initialization
     */
    init () {
        super.init();
    }

    generalInfoJson () {
        const json = {};
        json.timestamp = new Date().toISOString();

        if (SvGlobals.has("SvApp")) {
            json.app = SvApp.shared().name();
            json.version = SvApp.shared().versionsString();
        }

        if (SvPlatform.isBrowserPlatform()) {
            json.userAgent = navigator.userAgent;
            json.url = window.location.href;
            json.referrer = document.referrer || null;
        }
        
        return json;
    }

    errorInfoJson () {
        const normalizedError = Error_ideal.normalizeError(error);

        const json = {};

        if (normalizedError.message) {
            json.message = normalizedError.message;
        }
        if (normalizedError.name) {
            json.name = normalizedError.name;
        }
        if (normalizedError.stack) {
            json.stack = normalizedError.stack;
        }

        return json;
    }

    composeBodyJson () {
        const error = this.error();
        assert(error, "no error to report");

        // Prepare error data
        const json = {};
        json.general = this.generalInfoJson();
        json.error = this.errorInfoJson();
        json.additional = this.additionalJson();

        this.setBodyJson(json);
    }

    /**
     * Posts an error report to the server's /log_error endpoint
     * @param {Error|Object} error - Error object or error-like object with message property
     * @param {Object} [json=null] - Additional JSON data to include in the report
     * @returns {Promise<Object>} - Server response
     * @category Error Handling
     */
    async asyncSend () {
        try {
            this.composeBodyJson();
           await this.justSend();
        } catch (error) {
            console.error("Failed to send error report:", error);
            return { success: false, error: error.message };
        }
    }

    async justSend () {
        if (SvPlatform.isNodePlatform()) {
            console.warn("Not sure where to send error reports in node");
            return { success: false, error: "Not sure where to send error reports in node" };
        }
        // Get the base URL from the current window location
        const protocol = window.location.protocol; // "http:" or "https:"
        const host = window.location.hostname;
        const port = window.location.port || (protocol === "https:" ? "443" : "80");
        const baseUrl = `${protocol}//${host}:${port}`;

        // Post the error data to the server
        const response = await fetch(`${baseUrl}/log_error`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(this.bodyJson())
        });
        
        // Parse and return the response
        const responseData = await response.json();
        console.log("Error report sent successfully: ", responseData);
        return responseData;
    }

}.initThisClass());