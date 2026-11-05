"use strict";

/**
 * @module library.media
 */

/**
 * @class SvMicrophones
 * @extends SvBaseNode
 * @classdesc The microphones this device has, for a picker: a list kept
 * current from the browser (enumerateDevices), refreshed when devices come
 * and go and when asked (labels appear only once the page may use the
 * microphone). Synchronous to read — a slot's validValuesClosure is — and
 * posts onMicrophonesChanged when the list changes.
 *
 * Browser-only: a model reaches it through SvGlobals.has("SvMicrophones"),
 * so headless code reads no microphones.
 *
 *     SvMicrophones.shared().inputs(); // [{ deviceId, label }]
 */
(class SvMicrophones extends SvBaseNode {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        {
            /**
             * @member {Array} inputs - [{ deviceId, label }], the system default excluded
             * @category Devices
             */
            const slot = this.newSlot("inputs", null);
            slot.setSlotType("Array");
        }
        {
            /**
             * @member {Boolean} isWatching - listening for devices coming and going
             * @category Devices
             */
            const slot = this.newSlot("isWatching", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init();
        this.setInputs([]);
        return this;
    }

    /**
     * @description Whether this browser can list its devices.
     * @returns {Boolean}
     * @category Devices
     */
    hasMediaDevices () {
        return typeof navigator !== "undefined" && !!navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === "function";
    }

    /**
     * @description Starts keeping the list current, once.
     * @returns {SvMicrophones}
     * @category Devices
     */
    startWatching () {
        if (!this.isWatching() && this.hasMediaDevices()) {
            this.setIsWatching(true);
            navigator.mediaDevices.addEventListener("devicechange", () => this.asyncRefresh());
            this.asyncRefresh();
        }
        return this;
    }

    /**
     * @description Re-reads the device list; posts onMicrophonesChanged when
     * it differs.
     * @returns {Promise<SvMicrophones>}
     * @category Devices
     */
    async asyncRefresh () {
        if (!this.hasMediaDevices()) {
            return this;
        }
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = this.inputsFrom(devices);
            if (JSON.stringify(inputs) !== JSON.stringify(this.inputs())) {
                this.setInputs(inputs);
                this.postNoteNamed("onMicrophonesChanged");
            }
        } catch (e) {
            console.warn(this.logPrefix(), "could not list microphones:", e && e.message);
        }
        return this;
    }

    /**
     * @description The real microphones among the devices — not the
     * browser's "default" and "communications" aliases — each with a label
     * ("Microphone 2" until the page may use the microphone).
     * @param {Array<MediaDeviceInfo>} devices
     * @returns {Array<Object>}
     * @category Devices
     */
    inputsFrom (devices) {
        const aliases = new Set(["default", "communications", ""]);
        return devices.filter(d => d.kind === "audioinput" && !aliases.has(d.deviceId))
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || ("Microphone " + (i + 1)) }));
    }

    /**
     * @description Whether a device is listed now.
     * @param {String} deviceId
     * @returns {Boolean}
     * @category Devices
     */
    hasInput (deviceId) {
        return this.inputs().some(d => d.deviceId === deviceId);
    }

}.initThisClass());
