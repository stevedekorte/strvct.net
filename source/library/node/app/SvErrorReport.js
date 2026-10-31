"use strict";


/**
 * @class SvErrorReport
 * @extends SvTitledNode
 * @classdesc A class for reporting errors to the server.
 *
 * Example:
 *
 * await SvErrorReport.asyncSend(new Error("Test error message"), optionalAdditionalJson);
 *
 */

(class SvErrorReport extends SvTitledNode {

    static initClass () {
        this.newClassSlot("lastSends", null); // message → { at, held }: when each message was last sent, and repeats held back since
        this.newClassSlot("repeatWindowMs", 60 * 1000);
    }

    /**
     * @description Sends an error report — but the same message at most once
     * per repeatWindowMs: a loop that fails and reports on every turn sent one
     * page's report over a million times in two hours (2026-10-28). Repeats
     * in the window are held back and counted; the next one sent carries the
     * count (additional.heldRepeats).
     * @param {Error|Object} error
     * @param {Object} [additionalJson]
     * @returns {Promise<Object>}
     * @category Error Handling
     */
    static async asyncSend (error, additionalJson = null) {
        const held = this.heldRepeatsBeforeSending(error);
        if (held === null) {
            return { success: false, held: true };
        }
        const errorReport = SvErrorReport.clone();
        errorReport.setError(error);
        errorReport.setAdditionalJson(held > 0 ? Object.assign({ heldRepeats: held }, additionalJson) : additionalJson);
        return await errorReport.asyncSend();
    }

    /**
     * @description Notes a send of this error's message: null when the same
     * message went out within repeatWindowMs (hold this one back), else how
     * many repeats were held back since the last send.
     * @param {Error|Object} error
     * @returns {Number|null}
     * @category Error Handling
     */
    static heldRepeatsBeforeSending (error) {
        if (!this.lastSends()) {
            this.setLastSends(new Map());
        }
        const key = String((error && error.message) || error);
        const now = Date.now();
        const last = this.lastSends().get(key);
        if (last && now - last.at < this.repeatWindowMs()) {
            last.held++;
            return null;
        }
        this.lastSends().set(key, { at: now, held: 0 });
        return last ? last.held : 0;
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
        assert(this.error(), "missing error to report");

        const normalizedError = Error.normalizeError(this.error());

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
            console.error("Failed to send error report: ", error);
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
