"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class BatteryListener
 * @extends EventSetListener
 * @classdesc Listens to BatteryManager events (chargingchange, levelchange,
 * dischargingtimechange). The listenTarget should be a BatteryManager instance
 * obtained from navigator.getBattery().
 */
(class BatteryListener extends EventSetListener {

    /**
     * @description Initializes the prototype slots for the BatteryListener.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the BatteryListener.
     * @returns {BatteryListener} The initialized BatteryListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the listeners for BatteryManager events.
     * @returns {BatteryListener} The BatteryListener instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("chargingchange", "onChargingChange");
        this.addEventNameAndMethodName("levelchange", "onLevelChange");
        this.addEventNameAndMethodName("dischargingtimechange", "onDischargingTimeChange");
        return this;
    }

}.initThisClass());
