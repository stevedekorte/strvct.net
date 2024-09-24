"use strict";

/**
 * @module library.view.events.devices
 */

/**
 * @class Devices
 * @extends ProtoClass
 * @classdesc Devices class for setting up standard devices.
 * 
 * Right now, this just sets up the standard devices. 
 * Later, we can using it for 
 *     - discovering
 *     - organizing
 *     - inspecting
 *     - managing
 *     - globally intercepting & recording input for debugging or playback
 *     etc.
 */
(class Devices extends ProtoClass {
    
    /**
     * @static
     * @description Initializes the class.
     */
    static initClass () {
        this.setIsSingleton(true)
    }
    
    /**
     * @description Initializes the prototype slots.
     */
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("gamePadListener", null);
            slot.setSlotType("GamePadListener");
        }
        */
        /**
         * @property {BMKeyboard} keyboard
         */
        {
            const slot = this.newSlot("keyboard", null);
            slot.setSlotType("BMKeyboard");
        }
        /**
         * @property {Mouse} mouse
         */
        {
            const slot = this.newSlot("mouse", null);
            slot.setSlotType("Mouse");
        }
        /**
         * @property {TouchScreen} touchScreen
         */
        {
            const slot = this.newSlot("touchScreen", null);
            slot.setSlotType("TouchScreen");
        }
        /**
         * @property {GamePadManager} gamePadManager
         */
        {
            const slot = this.newSlot("gamePadManager", null);
            slot.setSlotType("GamePadManager");
        }
        /**
         * @property {Boolean} isSetup
         */
        {
            const slot = this.newSlot("isSetup", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the instance.
     * @returns {Devices} The instance.
     */
    init () {
        super.init()
        this.setupIfNeeded() 
        return this
    }

    /**
     * @description Sets up the devices if needed.
     * @returns {Devices} The instance.
     */
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

    /**
     * @description Gets the current touch or mouse event.
     * @returns {Event} The current touch or mouse event.
     */
    currentTouchOrMouseEvent () {
        // needed?
        const me = Mouse.shared().currentEvent()
        const te = TouchScreen.shared().currentEvent()
        const es = [me, te]
        es.filter(e => !TypeError.isNullOrUndefined(e))
        return es.min(e => e.timeStamp)
    }
    
}.initThisClass());