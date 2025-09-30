"use strict";

/**
 * TimeFormatter takes a JavaScript Date and produces a formatted string description
 * following the object's format option properties.
 *
 * @example
 * const formatter = TimeFormatter.clone()
 * formatter.setIs24Hour(false)          // this is the default
 * formatter.setShowsMeridiem(true)      // this is the default
 * formatter.setUppercaseMeridiem(false) // this is the default
 * formatter.setAmString("am")           // this is the default
 * formatter.setPmString("pm")           // this is the default
 * formatter.setShowsSeconds(false)      // this is the default
 * formatter.setShowsMilliseconds(false) // this is the default
 * formatter.setHourMinuteSpacer(":")    // this is the default
 * formatter.setDate(new Date())
 * const aDateString = formatter.formattedValue()
 *
 * // example output: "10:11am"
 *
 * @module library.ideal.formatters
 * @class TimeFormatter
 * @extends ProtoClass
 */
(class TimeFormatter extends ProtoClass {
    initPrototypeSlots () {
        /**
         * @description The date to be formatted.
         * @type {Date}
         * @default null
         * @member {Date} date
         * @category Data
         */
        {
            const slot = this.newSlot("date", null); // temp value which will be formatted
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Date"); // a javascript Date object
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to use 24-hour format.
         * @type {boolean}
         * @default false
         * @member {boolean} is24Hour
         * @category Formatting
         */
        {
            const slot = this.newSlot("is24Hour", false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to show meridiem (AM/PM).
         * @type {boolean}
         * @default true
         * @member {boolean} showsMeridiem
         * @category Formatting
         */
        {
            const slot = this.newSlot("showsMeridiem", true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to uppercase the meridiem.
         * @type {boolean}
         * @default false
         * @member {boolean} uppercaseMeridem
         * @category Formatting
         */
        {
            const slot = this.newSlot("uppercaseMeridem", false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description The string to use for AM.
         * @type {string}
         * @default "am"
         * @member {string} amString
         * @category Formatting
         */
        {
            const slot = this.newSlot("amString", "am");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setCanInspect(true);
        }

        /**
         * @description The string to use for PM.
         * @type {string}
         * @default "pm"
         * @member {string} pmString
         * @category Formatting
         */
        {
            const slot = this.newSlot("pmString", "pm");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to pad hours with zeros.
         * @type {boolean}
         * @default false
         * @member {boolean} doesPadHours
         * @category Formatting
         */
        {
            const slot = this.newSlot("doesPadHours", false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to show hours.
         * @type {boolean}
         * @default true
         * @member {boolean} showsHours
         * @category Formatting
         */
        {
            const slot = this.newSlot("showsHours", true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description The spacer between hours and minutes.
         * @type {string}
         * @default ":"
         * @member {string} hourMinuteSpacer
         * @category Formatting
         */
        {
            const slot = this.newSlot("hourMinuteSpacer", ":");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to show minutes.
         * @type {boolean}
         * @default true
         * @member {boolean} showsMinutes
         * @category Formatting
         */
        {
            const slot = this.newSlot("showsMinutes", true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to show seconds.
         * @type {boolean}
         * @default false
         * @member {boolean} showsSeconds
         * @category Formatting
         */
        {
            const slot = this.newSlot("showsSeconds", false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to show milliseconds.
         * @type {boolean}
         * @default false
         * @member {boolean} showsMilliseconds
         * @category Formatting
         */
        {
            const slot = this.newSlot("showsMilliseconds", false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }
    }

    initPrototype () {
    }

    /**
     * Pads a number with leading zeros to a specified length.
     * @param {number} n - The number to pad.
     * @param {number} [padLength=2] - The desired length of the padded number.
     * @returns {string} The padded number as a string.
     * @category Formatting
     */
    paddedNumber (n, padLength) {
        if (!padLength) {
            padLength = 2;
        }
        const s = "" + n;
        if (s.length < padLength) {
            return "0".repeat(padLength - s.length) + s;
        }
        return s;
    }

    /**
     * Gets the hours in 12-hour format.
     * @returns {number} The hours in 12-hour format.
     * @category Formatting
     */
    getTwelveHours () {
        let h = this.date().getHours();
        if (h > 12) { h -= 12; }
        if (h === 0) { h = 12; }
        return h;
    }

    /**
     * Gets the date in zero-padded US format (HH:MM).
     * @returns {string} The date in zero-padded US format.
     * @category Formatting
     */
    zeroPaddedUSDate () {
        return this.paddedNumber(this.getTwelveHours()) + ":" + this.paddedNumber(this.getMinutes());
    }

    /**
     * Gets the hours string based on the formatter's settings.
     * @returns {string} The hours string.
     * @category Formatting
     */
    hoursString () {
        let h = this.date().getHours();

        if (!this.is24Hour()) {
            h = this.getTwelveHours();
        }

        if (this.doesPadHours()) {
            this.paddedNumber(h);
        }

        return "" + h;
    }

    /**
     * Gets the minutes string.
     * @returns {string} The minutes string.
     * @category Formatting
     */
    minutesString () {
        return this.paddedNumber(this.date().getMinutes());
    }

    /**
     * Gets the seconds string.
     * @returns {string} The seconds string.
     * @category Formatting
     */
    secondsString () {
        return this.paddedNumber(this.date().getSeconds());
    }

    /**
     * Gets the milliseconds string.
     * @returns {string} The milliseconds string.
     * @category Formatting
     */
    millisecondsString () {
        return this.paddedNumber(this.date().getMilliseconds() % 1000);
    }

    /**
     * Gets the meridiem string (AM/PM) based on the formatter's settings.
     * @returns {string} The meridiem string.
     * @category Formatting
     */
    meridiemString () {
        let s = "";

        if (this.date().getHours() < 12) {
            s = this.amString();
        } else {
            s = this.pmString();
        }

        if (this.uppercaseMeridem()) {
            s = s.toUpperCase();
        }

        return s;
    }

    /**
     * Formats the date value into a string based on the formatter's settings.
     * @returns {string} The formatted date string.
     * @category Formatting
     */
    formattedValue () {
        assert(this.date());
        let s = "";

        if (this.showsHours()) {
            s += this.hoursString();
        }

        if (this.showsMinutes()) {
            if (s.length) {
                s += this.hourMinuteSpacer();
            }
            s += this.minutesString();
        }

        if (this.showsMeridiem()) { // correct location wrt seconds?
            s += this.meridiemString();
        }

        if (this.showsSeconds()) {
            if (s.length) {
                s += this.hourMinuteSpacer();
            }
            s += this.secondsString();
        }

        if (this.showsMilliseconds()) {
            if (s.length) {
                s += this.hourMinuteSpacer();
            }
            s += this.millisecondsString();
        }

        if (true) {
            const h = this.date().getHours();
            const m = this.date().getMinutes();
            if (h === 0 && m === 0) {
                s = "midnight";
            }

            if (h === 12 && m === 0) {
                s = "noon";
            }
        }

        return s;
    }
}.initThisClass());
