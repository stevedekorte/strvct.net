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

    static async asyncSend (error, json = null) {
        const errorReport = SvErrorReport.clone();
        errorReport.setError(error);

        if (!Type.isJsonType(json)) {
            const errorMessage = Type.errorWithJsonType(json);
            console.warn("SvErrorReport json argument is not a valid JSON type: " + errorMessage);
            debugger;
        }
        errorReport.setJson(json);
        return await errorReport.asyncSend();
    }

    /**
     * Test method to verify error reporting functionality
     * @param {string} [message="Test error message"] - Test error message
     * @returns {Promise<Object>} - Server response
     * @category Error Handling
     */
    static async test () {
        const message = "Test error message";
        console.log("Testing error reporting with message: '", message, "'");
        
        const testError = new Error(message);
        testError.name = "TestError";
        
        const additionalData = {
            isTest: true,
            testTime: Date.now(),
            component: "ErrorReportingSystem"
        };
        
        const errorReport = SvErrorReport.clone();
        errorReport.setError(testError);
        errorReport.setJson(additionalData);
        return await errorReport.asyncSend();
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
            const slot = this.newSlot("json", null);
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



    /**
     * Posts an error report to the server's /log_error endpoint
     * @param {Error|Object} error - Error object or error-like object with message property
     * @param {Object} [json=null] - Additional JSON data to include in the report
     * @returns {Promise<Object>} - Server response
     * @category Error Handling
     */
    async asyncSend () {
        try {
            const error = this.error();
            assert(error, "no error to report");
            const json = this.json();

 
            // Prepare error data
            const errorData = {
                timestamp: new Date().toISOString(),
                app: SvApp.shared().name(),
                version: SvApp.shared().versionsString()
            };

            if (SvPlatform.isBrowserPlatform()) {
                errorData.userAgent = navigator.userAgent;
                errorData.url = window.location.href;
                errorData.referrer = document.referrer || null;
            }
            
            // Add error information
            if (error instanceof Error) {
                errorData.message = error.message;
                errorData.name = error.name;
                errorData.stack = error.stack;
            } else if (typeof error === "object") {
                // Handle error-like objects
                Object.assign(errorData, error);
            } else if (typeof error === "string") {
                // Handle string errors
                errorData.message = error;
            }
            
            // Add additional JSON data if provided
            if (json && typeof json === "object") {
                errorData.additionalData = json;
            }
            
            try {

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
                    body: JSON.stringify(errorData)
                });
                
                // Parse and return the response
                const responseData = await response.json();
                console.log("Error report sent successfully:", responseData);
                return responseData;
            } catch (err) {
                console.error("Failed to send error report:", err);
                return { success: false, error: err.message };
            }

        } catch (err) {
            console.error("Failed to send error report:", err);
            return { success: false, error: err.message };
        }
    }

}.initThisClass());