"use strict";

/**
 * @module library.services.AiServiceKit.Requests
 */

/**
 * @class SvAiRequestDelegateProtocol
 * @extends Protocol
 * @classdesc Delegate protocol for AI request lifecycle events and streaming data callbacks.
 */

(class SvAiRequestDelegateProtocol extends Protocol {

    /**
     * @description Handles the start of an AI HTTP request.
     * @param {Object} aiRequest - The AI request instance.
     */
    onRequestBegin (aiRequest) {
    }

    /**
     * @description Handles incoming streaming SSE data chunks.
     * @param {string} dataChunk - Incoming text stream chunk.
     * @param {Object} aiRequest - The AI request instance.
     */
    onStreamData (dataChunk, aiRequest) {
    }

    /**
     * @description Handles successful completion of an AI request.
     * @param {Object} aiRequest - The AI request instance.
     */
    onRequestComplete (aiRequest) {
    }

    /**
     * @description Handles AI request failures or HTTP error responses.
     * @param {Object} aiRequest - The AI request instance.
     * @param {Error} error - Error instance or message string.
     */
    onRequestFailure (aiRequest, error) {
    }

}.initThisProtocol());
