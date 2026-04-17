"use strict";

/**
 * @module library.view.events.devices
 */

/**
 * @class SvDevices
 * @extends ProtoClass
 * @classdesc SvDevices class for setting up standard devices.
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
(class SvDevices extends ProtoClass {

    /**
     * @static
     * @description Initializes the class.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("gamePadListener", null);
            slot.setSlotType("SvGamePadListener");
        }
        */
        /**
         * @member {SvKeyboard} keyboard
         * @category Input SvDevices
         */
        {
            const slot = this.newSlot("keyboard", null);
            slot.setSlotType("SvKeyboard");
        }
        /**
         * @member {SvMouse} mouse
         * @category Input SvDevices
         */
        {
            const slot = this.newSlot("mouse", null);
            slot.setSlotType("SvMouse");
        }
        /**
         * @member {SvTouchScreen} touchScreen
         * @category Input SvDevices
         */
        {
            const slot = this.newSlot("touchScreen", null);
            slot.setSlotType("SvTouchScreen");
        }
        /**
         * @member {SvGamePadManager} gamePadManager
         * @category Input SvDevices
         */
        {
            const slot = this.newSlot("gamePadManager", null);
            slot.setSlotType("SvGamePadManager");
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
     * @returns {SvDevices} The instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setupIfNeeded();
        return this;
    }

    /**
     * @description Sets up the devices if needed.
     * @returns {SvDevices} The instance.
     * @category Setup
     */
    setupIfNeeded () {
        if (SvPlatform.isNodePlatform()) {
            console.log("🟡 DEVICES: setupIfNeeded: not in browser environment - ignoring");
            return this;
        }

        if (!this.isSetup()) {
            SvMouse.shared();
            SvKeyboard.shared();
            SvTouchScreen.shared();
            //SvGamePadManager.shared()
            this.setIsSetup(true);
        }
        return this;
    }

    /**
     * @description Gets the current touch or mouse event.
     * @returns {Event} The current touch or mouse event.
     * @category Event Handling
     */
    currentTouchOrMouseEvent () {
        // needed?
        const me = SvMouse.shared().currentEvent();
        const te = SvTouchScreen.shared().currentEvent();
        const es = [me, te];
        es.filter(e => !TypeError.isNullOrUndefined(e));
        return es.min(e => e.timeStamp);
    }

}.initThisClass());
