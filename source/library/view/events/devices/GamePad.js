"use strict";

/*
    GamePad

    A single GamePad with a unique id.

*/

(class GamePad extends Device {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("gamePadManager", null);
            slot.setSlotType("GamePadManager");
        }
        {
            const slot = this.newSlot("index", null);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("id", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("timestamp", null);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("buttons", null);
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("axes", null);
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("isConnected", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("shouldSendNotes", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init();
        this.setButtons([]);
        this.setAxes([]);
        this.setIsDebugging(false);
        return this;
    }

    updateData (gp) {
        assert(gp.id() === this.id()) // quick sanity check

        if (gp.timestamp !== this.timestamp()) {
            this.setTimestamp(gp.timestamp)
            this.updateButtons(gp.buttons)
            this.updateAxes(gp.axes)
        }
    }

    // buttons

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

    changedButtonIndexTo (index, isDown) {
        const note = BMNotificationCenter.shared().newNote().setSender(this)
        note.setName("onGamePadButton" + index + (isDown ? "Down" : "Up")) // TODO: optimize
        note.setInfo(isDown)
        note.post()
        return this
    }

    // axes

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

    changedAxesIndexTo (index, value) {
        const note = BMNotificationCenter.shared().newNote().setSender(this)
        note.setName("onGamePadAxis" + index + "Changed") // TODO: optimize?
        note.setInfo(value)
        note.post()
        return this
    }

    // connecting

    onConnected () {
        this.setIsConnected(true)
        const note = BMNotificationCenter.shared().newNote().setSender(this)
        note.setName("onGamePadConnected")
        note.post()
        return this
    }

    onDisconnected () {
        this.setIsConnected(false)
        const note = BMNotificationCenter.shared().newNote().setSender(this)
        note.setName("onGamePadDisconnected")
        note.post()
        return this
    }

}.initThisClass());
