"use strict";

/**
 * @module library.view.events.devices
 */

/**
 * @class SvGamePadManager
 * @extends ProtoClass
 * @classdesc SvGamePadManager
 *
 * - checks if gamepad API is supported
 * - polls navigator gamepads state
 * - creates and removes SvGamePad instances to match current state
 * - can send notification of state changes for each SvGamePad
 *
 * Since Chrome doesn't support gamePadListener, I'm just implementing
 * it to work without it, though this requires polling for game pad connected.
 *
 * Example use:
 *
 * // check for game pad support
 * const isSupported = SvGamePadManager.shared().isSupported()
 *
 * // start monitoring gamepads
 * SvGamePadManager.shared().startPolling()
 *
 * // get array of connected game pads
 * const pads = SvGamePadManager.shared().connectedGamePads()
 *
 * // each pad will have a unique id to identiy it
 * pads.forEach( (pad) => {
 *     console.log("pad id:", pad.id())
 * })
 */
(class SvGamePadManager extends ProtoClass {

    /**
     * @description Initializes the prototype slots for the SvGamePadManager class.
     */
    initPrototypeSlots () {
        //this.newSlot("gamePadListener", null)
        /**
         * @member {Map} gamePadsMap
         * @category State
         */
        {
            const slot = this.newSlot("gamePadsMap", null);
            slot.setSlotType("Map");
        }
        /**
         * @member {number} pollPeriod - milliseconds
         * @category Configuration
         */
        {
            const slot = this.newSlot("pollPeriod", 1000);
            slot.setComment("milliseconds");
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the SvGamePadManager instance.
     * @returns {SvGamePadManager} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIsDebugging(false);
        this.setGamePadsMap(new Map());
        //this.startListening();
        this.startPollingIfSupported(); // could delay this until connection if listen API is supported
        return this;
    }

    /**
     * @description Returns an array of connected game pads.
     * @returns {Array} An array of connected SvGamePad instances.
     * @category State
     */
    connectedGamePads () {
        return this.gamePadsMap().valuesArray();
    }

    /*
    canListenForConnect () {
        return ("ongamepadconnected" in window);
    }

    startListening () {
        if (this.canListenForConnect()) {
            this.setGamePadListener(SvGamePadListener.clone().setUseCapture(true).setListenTarget(window).setDelegate(this))
            this.gamePadListener().setIsListening(true)
        }
        return this
    }

    // listener events


    onGamePadConnected (event) {
        this.poll()
        return true
    }

    onGamePadDisconnected (event) {
        this.poll()
        return true
    }
    */

    /**
     * @description Starts polling if the SvGamePad API is supported.
     * @category Polling
     */
    startPollingIfSupported () {
        if (this.isSupported()) {
            this.startPolling();
        }
    }

    /**
     * @description Checks if the SvGamePad API is supported.
     * @returns {boolean} True if supported, false otherwise.
     * @category Support
     */
    isSupported () {
        return this.navigatorGamepads() !== null;
    }

    /**
     * @description Returns the navigator gamepads object.
     * @returns {Object|null} The navigator gamepads object or null if not supported.
     * @category Support
     */
    navigatorGamepads () {
        if (navigator.getGamepads) {
            return navigator.getGamepads();
        }

        if (navigator.webkitGetGamepads) {
            return navigator.webkitGetGamepads;
        }

        return null;
    }

    /**
     * @description Starts polling for gamepad updates.
     * @category Polling
     */
    startPolling () {
        if (!this._intervalId) {
            console.log(this.svType() + ".startPolling()");
            this._intervalId = setInterval(() => {
                this.poll();
            }, this.pollPeriod());
        }
    }

    /**
     * @description Stops polling for gamepad updates.
     * @category Polling
     */
    stopPolling () {
        if (this.intervalId()) {
            clearInterval(this.intervalId());
            this.setIntervalId(null);
        }
    }

    /**
     * @description Creates a new SvGamePad instance.
     * @param {number} index - The index of the gamepad.
     * @returns {SvGamePad} A new SvGamePad instance.
     * @category Instance Management
     */
    newGamePad (index) {
        return SvGamePad.clone().setGamePadManager(this);
    }

    /**
     * @description Polls for gamepad updates and manages SvGamePad instances.
     * @category Polling
     */
    poll () {
        const gamepads = this.navigatorGamepads();
        //console.log(this.svType() + ".poll() gamepads.length = ", gamepads.length);
        const padsMap = this.gamePadsMap();

        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            let gamePad = padsMap.get(i);

            if (gp) {
                if (!gamePad) {
                    gamePad = this.newGamePad().setIndex(i).setId(gp.id);
                    gamePad.onConnected();
                    padsMap.set(i, gamePad);
                }
                gamePad.updateData(gp);

                if (this.isDebugging()) {
                    console.log("Gamepad index:" + gp.index + " id:" + gp.id +
                    ". buttonCount:" + gp.buttons.length + " axisCount:" + gp.axes.length);
                }
            } else {
                if (gamePad) {
                    gamePad.onDisconnected();
                    padsMap.set(i, null);
                }
            }
        }
    }

}.initThisClass());
