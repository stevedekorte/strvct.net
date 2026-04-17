"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvBatteryListener
 * @extends SvEventSetListener
 * @classdesc Listens to BatteryManager events (chargingchange, levelchange,
 * dischargingtimechange). The listenTarget should be a BatteryManager instance
 * obtained from navigator.getBattery().
 */
(class SvBatteryListener extends SvEventSetListener {

    /**
     * @description Initializes the prototype slots for the SvBatteryListener.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvBatteryListener.
     * @returns {SvBatteryListener} The initialized SvBatteryListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the listeners for BatteryManager events.
     * @returns {SvBatteryListener} The SvBatteryListener instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("chargingchange", "onChargingChange");
        this.addEventNameAndMethodName("levelchange", "onLevelChange");
        this.addEventNameAndMethodName("dischargingtimechange", "onDischargingTimeChange");
        return this;
    }

}.initThisClass());
