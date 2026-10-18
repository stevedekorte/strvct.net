"use strict";

/**
 * @module library.services.AiServiceKit.Requests
 */

/**
 * @interface SvAiRequestDelegateProtocol
 * @extends SvDelegateProtocol
 * @classdesc What an AI request tells its delegate through its life and as its response streams in. Sent by SvAiRequest (sendDelegateMessage); every message is
 * optional. Written from the sends in SvAiRequest — when it sends a new message,
 * add it here (the delegate-message tripwire and TestDelegateProtocols say so).
 */
(class SvAiRequestDelegateProtocol extends SvDelegateProtocol {

    /**
     * @description The request was sent.
     * @param {SvAiRequest} request - The request.
     * @category Delegation
     */
    onRequestBegin (request) {
    }

    /**
     * @description The response began streaming.
     * @param {SvAiRequest} request - The request.
     * @category Delegation
     */
    onStreamStart (request) {
    }

    /**
     * @description Streamed text arrived.
     * @param {SvAiRequest} request - The request.
     * @param {String} chunk - The visible text that arrived.
     * @category Delegation
     */
    onStreamData (request, chunk) {
    }

    /**
     * @description The stream finished.
     * @param {SvAiRequest} request - The request.
     * @category Delegation
     */
    onStreamEnd (request) {
    }

    /**
     * @description The stream was aborted.
     * @param {SvAiRequest} request - The request.
     * @category Delegation
     */
    onStreamAbort (request) {
    }

    /**
     * @description The request finished (successfully or not).
     * @param {SvAiRequest} request - The request.
     * @category Delegation
     */
    onRequestComplete (request) {
    }

    /**
     * @description The request failed.
     * @param {SvAiRequest} request - The request.
     * @param {Error} error - What went wrong.
     * @category Delegation
     */
    onRequestError (request, error) {
    }

}.initThisProtocol());
