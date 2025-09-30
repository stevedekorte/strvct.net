"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class WebSocketListener
 * @extends EventSetListener
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
(class WebSocketListener extends EventSetListener {

    /**
     * @description Initializes the prototype slots for the WebSocketListener.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the WebSocketListener.
     * @returns {WebSocketListener} The initialized WebSocketListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the listeners for the WebSocket events.
     * @returns {WebSocketListener} The WebSocketListener instance with listeners set up.
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
