"use strict";

/**
 * @module library.services.Peer
 */

/**
 * @interface SvRzPeerConnDelegateProtocol
 * @extends SvDelegateProtocol
 * @classdesc What a WebRTC peer connection tells its delegate. Sent by SvRzPeerConn (sendDelegateMessage); every message is
 * optional. Written from the sends in SvRzPeerConn — when it sends a new message,
 * add it here (the delegate-message tripwire and TestDelegateProtocols say so).
 */
(class SvRzPeerConnDelegateProtocol extends SvDelegateProtocol {

    /**
     * @description The connection opened.
     * @param {SvRzPeerConn} peer - The connection.
     * @category Delegation
     */
    onPeerOpen (peer) {
    }

    /**
     * @description Data arrived.
     * @param {SvRzPeerConn} peer - The connection.
     * @param {Object} json - The data received.
     * @category Delegation
     */
    onPeerData (peer, json) {
    }

    /**
     * @description The connection failed.
     * @param {SvRzPeerConn} peer - The connection.
     * @param {Error} error - What went wrong.
     * @category Delegation
     */
    onPeerError (peer, error) {
    }

    /**
     * @description The connection closed.
     * @param {SvRzPeerConn} peer - The connection.
     * @category Delegation
     */
    onPeerClose (peer) {
    }

}.initThisProtocol());
