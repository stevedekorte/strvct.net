"use strict";

/*
    Devices

    Right now, this just sets up the standard devices. 
    Later, we can using it for 
        - discovering
        - organizing
        - inspecting
        - managing
        - globally intercepting & recording input for debugging or playback
        etc.

*/

(class Devices extends ProtoClass {
    
    static initClass () {
        this.setIsSingleton(true)
    }
    
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("gamePadListener", null);
            slot.setSlotType("GamePadListener");
        }
        */
        {
            const slot = this.newSlot("keyboard", null);
            slot.setSlotType("BMKeyboard");
        }
        {
            const slot = this.newSlot("mouse", null);
            slot.setSlotType("Mouse");
        }
        {
            const slot = this.newSlot("touchScreen", null);
            slot.setSlotType("TouchScreen");
        }
        {
            const slot = this.newSlot("gamePadManager", null);
            slot.setSlotType("GamePadManager");
        }
        {
            const slot = this.newSlot("isSetup", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init()
        this.setupIfNeeded() 
        return this
    }

    setupIfNeeded () {
        if (!this.isSetup()) {
            Mouse.shared()
            BMKeyboard.shared()
            TouchScreen.shared()
            //GamePadManager.shared()
            this.setIsSetup(true)
        }
        return this
    }

    currentTouchOrMouseEvent () {
        // needed?
        const me = Mouse.shared().currentEvent()
        const te = TouchScreen.shared().currentEvent()
        const es = [me, te]
        es.filter(e => !TypeError.isNullOrUndefined(e))
        return es.min(e => e.timeStamp)
    }
    
}.initThisClass());
