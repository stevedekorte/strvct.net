"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvWebSocketListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of web socket events.
 *
 * NOTES:
 *
 * MessageEvent contains:
 * - data
 * - origin
 * - lastEventId
 * - source
 * - ports
 */
(class SvWebSocketListener extends SvEventSetListener {

    /**
     * @description Initializes the prototype slots for the SvWebSocketListener.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvWebSocketListener.
     * @returns {SvWebSocketListener} The initialized SvWebSocketListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the listeners for the WebSocket events.
     * @returns {SvWebSocketListener} The SvWebSocketListener instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("open", "onOpen");
        this.addEventNameAndMethodName("close", "onClose");
        this.addEventNameAndMethodName("error", "onError");
        this.addEventNameAndMethodName("message", "onMessage");
        return this;
    }

}.initThisClass());
