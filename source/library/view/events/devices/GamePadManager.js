"use strict";

/**
 * @module library.view.events.devices
 */

/**
 * @class GamePadManager
 * @extends ProtoClass
 * @classdesc GamePadManager
 * 
 * - checks if gamepad API is supported
 * - polls navigator gamepads state
 * - creates and removes GamePad instances to match current state
 * - can send notification of state changes for each GamePad
 *
 * Since Chrome doesn't support gamePadListener, I'm just implementing
 * it to work without it, though this requires polling for game pad connected.
 *
 * Example use:
 *
 * // check for game pad support
 * const isSupported = GamePadManager.shared().isSupported()
 * 
 * // start monitoring gamepads
 * GamePadManager.shared().startPolling()
 *
 * // get array of connected game pads
 * const pads = GamePadManager.shared().connectedGamePads()
 *
 * // each pad will have a unique id to identiy it
 * pads.forEach( (pad) => { 
 *     console.log("pad id:", pad.id()) 
 * })
 */
(class GamePadManager extends ProtoClass {
    
    /**
     * @description Initializes the prototype slots for the GamePadManager class.
     */
    initPrototypeSlots () {
        //this.newSlot("gamePadListener", null)
        /**
         * @member {Map} gamePadsMap
         */
        {
            const slot = this.newSlot("gamePadsMap", null);
            slot.setSlotType("Map");
        }
        /**
         * @member {number} pollPeriod - milliseconds
         */
        {
            const slot = this.newSlot("pollPeriod", 1000);
            slot.setComment("milliseconds");
        }
    }

    /**
     * @description Initializes the GamePadManager instance.
     * @returns {GamePadManager} The initialized instance.
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
     * @returns {Array} An array of connected GamePad instances.
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
            this.setGamePadListener(GamePadListener.clone().setUseCapture(true).setListenTarget(window).setDelegate(this))
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
     * @description Starts polling if the GamePad API is supported.
     */
    startPollingIfSupported () {
        if (this.isSupported()) {
            this.startPolling();
        }
    }

    /**
     * @description Checks if the GamePad API is supported.
     * @returns {boolean} True if supported, false otherwise.
     */
    isSupported () {
        return this.navigatorGamepads() !== null;
    }

    /**
     * @description Returns the navigator gamepads object.
     * @returns {Object|null} The navigator gamepads object or null if not supported.
     */
    navigatorGamepads () {
        if (navigator.getGamepads) {
            return navigator.getGamepads();
        } 
        
        if (navigator.webkitGetGamepads) {
            return navigator.webkitGetGamepads;
        }

        return null
    }

    /**
     * @description Starts polling for gamepad updates.
     */
    startPolling () {
        if (!this._intervalId) {
            console.log(this.type() + ".startPolling()");
            this._intervalId = setInterval(() => { 
                this.poll();
            }, this.pollPeriod());
        }
    }

    /**
     * @description Stops polling for gamepad updates.
     */
    stopPolling () {
        if (this.intervalId()) {
            clearInterval(this.intervalId());
            this.setIntervalId(null);
        }
    }

    /**
     * @description Creates a new GamePad instance.
     * @param {number} index - The index of the gamepad.
     * @returns {GamePad} A new GamePad instance.
     */
    newGamePad (index) {
        return GamePad.clone().setGamePadManager(this);
    }

    /**
     * @description Polls for gamepad updates and manages GamePad instances.
     */
    poll () {
        const gamepads = this.navigatorGamepads();
        //console.log(this.type() + ".poll() gamepads.length = ", gamepads.length);
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