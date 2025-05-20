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
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true)
    }
    
    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("gamePadListener", null);
            slot.setSlotType("GamePadListener");
        }
        */
        /**
         * @member {SvKeyboard} keyboard
         * @category Input Devices
         */
        {
            const slot = this.newSlot("keyboard", null);
            slot.setSlotType("SvKeyboard");
        }
        /**
         * @member {Mouse} mouse
         * @category Input Devices
         */
        {
            const slot = this.newSlot("mouse", null);
            slot.setSlotType("Mouse");
        }
        /**
         * @member {TouchScreen} touchScreen
         * @category Input Devices
         */
        {
            const slot = this.newSlot("touchScreen", null);
            slot.setSlotType("TouchScreen");
        }
        /**
         * @member {GamePadManager} gamePadManager
         * @category Input Devices
         */
        {
            const slot = this.newSlot("gamePadManager", null);
            slot.setSlotType("GamePadManager");
        }
        /**
         * @member {Boolean} isSetup
         * @category State
         */
        {
            const slot = this.newSlot("isSetup", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the instance.
     * @returns {Devices} The instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setupIfNeeded() 
        return this
    }

    /**
     * @description Sets up the devices if needed.
     * @returns {Devices} The instance.
     * @category Setup
     */
    setupIfNeeded () {
        if (!this.isSetup()) {
            Mouse.shared()
            SvKeyboard.shared()
            TouchScreen.shared()
            //GamePadManager.shared()
            this.setIsSetup(true)
        }
        return this
    }

    /**
     * @description Gets the current touch or mouse event.
     * @returns {Event} The current touch or mouse event.
     * @category Event Handling
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