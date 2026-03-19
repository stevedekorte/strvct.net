"use strict";

/**
 * @module library.view.webbrowser
 */

/**
 * @class SvWebBrowserBattery
 * @extends ProtoClass
 * @classdesc Wraps the Battery Status API. Keeps charging, level, and
 * dischargingTime in sync via BatteryManager events.
 * Posts "onBatteryThrottling" notification when the battery level crosses
 * the expected throttling threshold.
 */
(class SvWebBrowserBattery extends ProtoClass {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("batteryManager", null);
            slot.setSlotType("Object");
        }

        {
            const slot = this.newSlot("batteryListener", null);
            slot.setSlotType("BatteryListener");
        }

        {
            const slot = this.newSlot("charging", false);
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("level", 1);
            slot.setSlotType("Number");
        }

        {
            const slot = this.newSlot("dischargingTime", Infinity);
            slot.setSlotType("Number");
        }

        {
            const slot = this.newSlot("expectedThrottlingLevel", 0.2);
            slot.setSlotType("Number");
        }

        {
            const slot = this.newSlot("isThrottling", null);
            slot.setSlotType("Boolean");
            slot.setAllowsNullValue(true);
        }
    }

    initPrototype () {
    }

    finalInit () {
        super.finalInit();
        this.startMonitoring();
    }

    /**
     * @description Requests the BatteryManager and begins listening for changes.
     * @returns {SvWebBrowserBattery}
     * @category Setup
     */
    async startMonitoring () {
        if (typeof navigator === "undefined" || !navigator.getBattery) {
            return this;
        }

        const bm = await navigator.getBattery();
        this.setBatteryManager(bm);
        this.syncFromManager();

        const listener = BatteryListener.clone();
        listener.setListenTarget(bm);
        listener.setDelegate(this);
        listener.setIsListening(true);
        this.setBatteryListener(listener);

        return this;
    }

    /**
     * @description Stops monitoring battery events and cleans up.
     * @returns {SvWebBrowserBattery}
     * @category Teardown
     */
    shutdown () {
        const listener = this.batteryListener();
        if (listener) {
            listener.setIsListening(false);
            this.setBatteryListener(null);
        }
        this.setBatteryManager(null);
        return this;
    }

    // --- BatteryListener delegate methods ---

    /**
     * @description Called when charging state changes.
     * @param {Event} event
     * @category Delegate
     */
    onChargingChange (event) {
        this.syncFromManager();
    }

    /**
     * @description Called when battery level changes.
     * @param {Event} event
     * @category Delegate
     */
    onLevelChange (event) {
        this.syncFromManager();
    }

    /**
     * @description Called when discharging time changes.
     * @param {Event} event
     * @category Delegate
     */
    onDischargingTimeChange (event) {
        this.syncFromManager();
    }

    /**
     * @description Whether the battery level is at or below the throttling threshold
     * and the device is not charging.
     * @returns {Boolean}
     * @category Status
     */
    detectThrottling () {
        return !this.charging() && this.level() <= this.expectedThrottlingLevel();
    }

    /**
     * @description Copies current values from the BatteryManager and posts
     * a notification if the throttling state changes.
     * @returns {SvWebBrowserBattery}
     * @category Sync
     */
    syncFromManager () {
        const bm = this.batteryManager();
        if (!bm) {
            return this;
        }

        const wasThrottling = this.isThrottling();

        this.setCharging(bm.charging);
        this.setLevel(bm.level);
        this.setDischargingTime(bm.dischargingTime);

        const nowThrottling = this.detectThrottling();
        this.setIsThrottling(nowThrottling);

        const isFirstPoll = wasThrottling === null;
        const throttlingStateChanged = nowThrottling !== wasThrottling;
        const startedThrottlingOnFirstPoll = isFirstPoll && nowThrottling;
        const shouldNotify = startedThrottlingOnFirstPoll || (!isFirstPoll && throttlingStateChanged);

        if (shouldNotify) {
            this.postNoteNamed("onBatteryThrottling");
        }

        return this;
    }

}.initThisClass());
