"use strict";

/**
 * @module library.services.Peer
 */

/**
 * @interface SvRzSigServerConnDelegateProtocol
 * @extends SvDelegateProtocol
 * @classdesc What a signaling-server connection tells its delegate about itself and its peer connections. Sent by SvRzSigServerConn (sendDelegateMessage); every message is
 * optional. Written from the sends in SvRzSigServerConn — when it sends a new message,
 * add it here (the delegate-message tripwire and TestDelegateProtocols say so).
 */
(class SvRzSigServerConnDelegateProtocol extends SvDelegateProtocol {

    /**
     * @description The signaling server connection opened.
     * @param {SvRzSigServerConn} server - The connection.
     * @category Delegation
     */
    onSigServerOpen (server) {
    }

    /**
     * @description It closed.
     * @param {SvRzSigServerConn} server - The connection.
     * @category Delegation
     */
    onSigServerClose (server) {
    }

    /**
     * @description It disconnected.
     * @param {SvRzSigServerConn} server - The connection.
     * @category Delegation
     */
    onSigServerDisconnected (server) {
    }

    /**
     * @description A peer connected.
     * @param {SvRzPeerConn} peerConn - The new peer connection.
     * @category Delegation
     */
    onPeerConnection (peerConn) {
    }

    /**
     * @description A peer connection closed.
     * @param {SvRzPeerConn} peerConn - The peer connection.
     * @category Delegation
     */
    onClosePeerConnection (peerConn) {
    }

    /**
     * @description A peer connection was removed.
     * @param {SvRzPeerConn} peerConn - The peer connection.
     * @category Delegation
     */
    onRemovePeerConnection (peerConn) {
    }

}.initThisProtocol());
