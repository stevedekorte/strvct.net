"use strict";

/**
 * @module library.services.Peer
 */

/**
 * @class SvPeerConnectionDelegateProtocol
 * @extends Protocol
 * @classdesc Delegate protocol for WebRTC peer connections and signaling server events.
 */

(class SvPeerConnectionDelegateProtocol extends Protocol {

    /**
     * @description Handles peer signaling server open event.
     */
    onPeerServerOpen () {
    }

    /**
     * @description Handles incoming peer connection attempts.
     * @param {Object} peerConn - The peer connection object.
     */
    onPeerConnection (peerConn) {
    }

    /**
     * @description Handles open peer connection state.
     * @param {Object} peerConn - The opened peer connection object.
     */
    onOpenPeerConnection (peerConn) {
    }

    /**
     * @description Handles closed peer connection state.
     * @param {Object} peerConn - The closed peer connection object.
     */
    onClosePeerConnection (peerConn) {
    }

    /**
     * @description Handles peer connection removal.
     * @param {Object} peerConn - The removed peer connection object.
     */
    onRemovePeerConnection (peerConn) {
    }

}.initThisProtocol());
