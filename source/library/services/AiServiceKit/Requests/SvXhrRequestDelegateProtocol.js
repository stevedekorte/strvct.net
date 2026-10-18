"use strict";

/**
 * @module library.services.AiServiceKit.Requests
 */

/**
 * @interface SvXhrRequestDelegateProtocol
 * @extends SvDelegateProtocol
 * @classdesc What an XHR request tells its delegate through its life. Sent by SvXhrRequest (sendDelegateMessage); every message is
 * optional. Written from the sends in SvXhrRequest — when it sends a new message,
 * add it here (the delegate-message tripwire and TestDelegateProtocols say so).
 */
(class SvXhrRequestDelegateProtocol extends SvDelegateProtocol {

    /**
     * @description The request was sent.
     * @param {SvXhrRequest} request - The request.
     * @category Delegation
     */
    onRequestBegin (request) {
    }

    /**
     * @description More of the response arrived.
     * @param {SvXhrRequest} request - The request.
     * @category Delegation
     */
    onRequestProgress (request) {
    }

    /**
     * @description The response arrived with a success status.
     * @param {SvXhrRequest} request - The request.
     * @category Delegation
     */
    onRequestSuccess (request) {
    }

    /**
     * @description The response arrived with a failure status.
     * @param {SvXhrRequest} request - The request.
     * @category Delegation
     */
    onRequestFailure (request) {
    }

    /**
     * @description The request finished (after onRequestSuccess or onRequestFailure).
     * @param {SvXhrRequest} request - The request.
     * @category Delegation
     */
    onRequestComplete (request) {
    }

    /**
     * @description The request could not be made or read.
     * @param {SvXhrRequest} request - The request.
     * @param {Error} error - What went wrong.
     * @category Delegation
     */
    onRequestError (request, error) {
    }

    /**
     * @description The request timed out.
     * @param {SvXhrRequest} request - The request.
     * @param {Error} error - The timeout error.
     * @category Delegation
     */
    onRequestTimeout (request, error) {
    }

    /**
     * @description The request was aborted.
     * @param {SvXhrRequest} request - The request.
     * @category Delegation
     */
    onRequestAbort (request) {
    }

}.initThisProtocol());
