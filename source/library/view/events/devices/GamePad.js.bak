"use strict";

/**
 * @module library.view.events.devices
 */

/**
 * @class GamePad
 * @extends Device
 * @classdesc A single GamePad with a unique id.
 */
(class GamePad extends Device {
    
    /**
     * @description Initializes the prototype slots for the GamePad class.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {GamePadManager} gamePadManager
         * @category Configuration
         */
        {
            const slot = this.newSlot("gamePadManager", null);
            slot.setSlotType("GamePadManager");
        }
        /**
         * @member {Number} index
         * @category Identification
         */
        {
            const slot = this.newSlot("index", null);
            slot.setSlotType("Number");
        }
        /**
         * @member {String} id
         * @category Identification
         */
        {
            const slot = this.newSlot("id", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Number} timestamp
         * @category State
         */
        {
            const slot = this.newSlot("timestamp", null);
            slot.setSlotType("Number");
        }
        /**
         * @member {Array} buttons
         * @category Input
         */
        {
            const slot = this.newSlot("buttons", null);
            slot.setSlotType("Array");
        }
        /**
         * @member {Array} axes
         * @category Input
         */
        {
            const slot = this.newSlot("axes", null);
            slot.setSlotType("Array");
        }
        /**
         * @member {Boolean} isConnected
         * @category State
         */
        {
            const slot = this.newSlot("isConnected", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} shouldSendNotes
         * @category Configuration
         */
        {
            const slot = this.newSlot("shouldSendNotes", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the GamePad instance.
     * @returns {GamePad} The initialized GamePad instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setButtons([]);
        this.setAxes([]);
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Updates the GamePad data.
     * @param {Object} gp - The gamepad object to update from.
     * @category Update
     */
    updateData (gp) {
        assert(gp.id() === this.id()) // quick sanity check

        if (gp.timestamp !== this.timestamp()) {
            this.setTimestamp(gp.timestamp)
            this.updateButtons(gp.buttons)
            this.updateAxes(gp.axes)
        }
    }

    /**
     * @description Updates the buttons of the GamePad.
     * @param {Array} newButtons - The new button states.
     * @returns {GamePad} The current GamePad instance.
     * @category Update
     */
    updateButtons (newButtons) {
        // make sure number of buttons is correct
        const currentButtons = this.buttons()
        while (currentButtons.length < newButtons.length) {
            currentButtons.push(0)
        }

        if (this.shouldSendNotes()) {
            // check for differences
            for (let i = 0; i < newButtons.length; i ++) {
                if (currentButtons.at(i) !== newButtons.at(i)) {
                    currentButtons.atPut(i, newButtons.at(i))
                    this.changedButtonIndexTo(i, newButtons.at(i))
                }
            }
        } else {
            this.setButtons(newButtons.shallowCopy())
        }

        return this
    }

    /**
     * @description Handles button state changes and posts notifications.
     * @param {Number} index - The index of the changed button.
     * @param {Boolean} isDown - The new state of the button.
     * @returns {GamePad} The current GamePad instance.
     * @category Event
     */
    changedButtonIndexTo (index, isDown) {
        const note = BMNotificationCenter.shared().newNote().setSender(this)
        note.setName("onGamePadButton" + index + (isDown ? "Down" : "Up")) // TODO: optimize
        note.setInfo(isDown)
        note.post()
        return this
    }

    /**
     * @description Updates the axes of the GamePad.
     * @param {Array} newAxes - The new axes values.
     * @returns {GamePad} The current GamePad instance.
     * @category Update
     */
    updateAxes (newAxes) {
        // make sure number of buttons is correct
        const currentAxes = this.axes()
        while (currentAxes.length < newAxes.length) {
            currentAxes.push(0)
        }

        if (this.shouldSendNotes()) {
            // check for differences
            for (let i = 0; i < newAxes.length; i ++) {
                if (currentAxes.at(i) !== newAxes.at(i)) {
                    currentAxes.atPut(i, newAxes.at(i))
                    this.changedAxesIndexTo(i, newAxes[i])
                }
            }
        } else {
            this.setAxes(newAxes.copy())
        }

        return this
    }

    /**
     * @description Handles axis value changes and posts notifications.
     * @param {Number} index - The index of the changed axis.
     * @param {Number} value - The new value of the axis.
     * @returns {GamePad} The current GamePad instance.
     * @category Event
     */
    changedAxesIndexTo (index, value) {
        const note = BMNotificationCenter.shared().newNote().setSender(this)
        note.setName("onGamePadAxis" + index + "Changed") // TODO: optimize?
        note.setInfo(value)
        note.post()
        return this
    }

    /**
     * @description Handles the connected event for the GamePad.
     * @returns {GamePad} The current GamePad instance.
     * @category Event
     */
    onConnected () {
        this.setIsConnected(true)
        const note = BMNotificationCenter.shared().newNote().setSender(this)
        note.setName("onGamePadConnected")
        note.post()
        return this
    }

    /**
     * @description Handles the disconnected event for the GamePad.
     * @returns {GamePad} The current GamePad instance.
     * @category Event
     */
    onDisconnected () {
        this.setIsConnected(false)
        const note = BMNotificationCenter.shared().newNote().setSender(this)
        note.setName("onGamePadDisconnected")
        note.post()
        return this
    }

}.initThisClass());