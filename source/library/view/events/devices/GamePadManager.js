"use strict";

/*
    GamePadManager

    - checks if gamepad API is supported
    - polls navigator gamepads state
    - creates and removes GamePad instances to match current state
    - can send notification of state changes for each GamePad

    Since Chrome doesn't support gamePadListener, I'm just implementing
    it to work without it, though this requires polling for game pad connected.

    Example use:

    // check for game pad support
    const isSupported = GamePadManager.shared().isSupported()
    
    // start monitoring gamepads
    GamePadManager.shared().startPolling()

    // get array of connected game pads
    const pads = GamePadManager.shared().connectedGamePads()

    // each pad will have a unique id to identiy it
    pads.forEach( (pad) => { 
        console.log("pad id:", pad.id()) 
    })

*/

(class GamePadManager extends ProtoClass {
    
    initPrototypeSlots () {
        //this.newSlot("gamePadListener", null)
        {
            const slot = this.newSlot("gamePadsMap", null);
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("pollPeriod", 1000);
            slot.setComment("milliseconds");
        }
    }

    init () {
        super.init();
        this.setIsDebugging(false);
        this.setGamePadsMap(new Map());
        //this.startListening();
        this.startPollingIfSupported(); // could delay this until connection if listen API is supported
        return this;
    }

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

    startPollingIfSupported () {
        if (this.isSupported()) {
            this.startPolling();
        }
    }

    isSupported () {
        return this.navigatorGamepads() !== null;
    }

    navigatorGamepads () {
        if (navigator.getGamepads) {
            return navigator.getGamepads();
        } 
        
        if (navigator.webkitGetGamepads) {
            return navigator.webkitGetGamepads;
        }

        return null
    }

    startPolling () {
        if (!this._intervalId) {
            console.log(this.type() + ".startPolling()");
            this._intervalId = setInterval(() => { 
                this.poll();
            }, this.pollPeriod());
        }
    }

    stopPolling () {
        if (this.intervalId()) {
            clearInterval(this.intervalId());
            this.setIntervalId(null);
        }
    }

    newGamePad (index) {
        return GamePad.clone().setGamePadManager(this);
    }

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