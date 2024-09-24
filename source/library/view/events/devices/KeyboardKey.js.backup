"use strict";

/*
    KeyboardKey


*/

(class KeyboardKey extends Device {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("isDown", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("code", null);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("keyboard", null);
            slot.setSlotType("BMKeyboard");
        }
    }

    init () {
        super.init()
        this.setIsDebugging(false)
        return this
    }

    onKeyDown (event) {
        //this.debugLog(() => this.name() + " onKeyDown " + event._id)
        let shouldPropogate = true
        this.setIsDown(true)
        return shouldPropogate
    }

    onKeyUp (event) {
        //this.debugLog(() => this.name() + " onKeyUp " + event._id)
        let shouldPropogate = true
        this.setIsDown(false)
        return shouldPropogate
    }

    isUp () {
        return !this.isDown()
    }

    isOnlyKeyDown () {
        return this.isDown() && this.keyboard().currentlyDownKeys().length
    }

    isAlphabetical (event) {
        const c = this.code()
        return c >= 65 && c <= 90
    }
    
}.initThisClass());