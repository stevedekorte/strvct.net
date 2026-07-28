"use strict";

/** * @module library.ideal.formatters
 */

/**
 * @class SvNumberFormatter
 * @extends ProtoClass
 * @classdesc Takes a number and returns a string with a more human readable format. const stringVersion = SvNumberFormatter.clone().setValue(1234).setSignificantDigits(2).formattedValue(); // stringVersion will be "1.2K"
 */
(class SvNumberFormatter extends ProtoClass {
    initPrototypeSlots () {

        /**
         * @description The number to be formatted.
         * @type {number}
         * @default 0
         * @member {number} value
         * @category Data
         */
        {
            const slot = this.newSlot("value", 0);
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Number");
            slot.setCanInspect(false);
        }

        /**
         * @description The number of significant digits to use in the formatted output.
         * @type {number}
         * @default 2
         * @member {number} significantDigits
         * @category Configuration
         */
        {
            const slot = this.newSlot("significantDigits", 2);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
            slot.setCanInspect(true);
        }
    }

    initPrototype () {
    }

    /**
     * Formats the number value into a human-readable string.
     * @returns {string} The formatted number value.
     * @method
     * @category Formatting
     */
    formattedValue () {
        const number = this.value();
        const significantDigits = this.significantDigits();

        // NaN / Infinity have no magnitude; report them rather than compute on them
        if (!Number.isFinite(number)) {
            return String(number);
        }

        // Handle zero to avoid Math.log10(0) = -Infinity
        if (number === 0) {
            return "0";
        }

        const suffixes = ["", "K", "M", "B", "T"];

        // The magnitude MUST be clamped into the suffix table. |value| < 1
        // yields a negative magnitude and |value| >= 1e15 overruns the table;
        // either way suffixes[magnitude] was undefined, and `Number + undefined`
        // is numeric addition — so this method returned the NUMBER NaN rather
        // than a string, and every caller rendered "NaN". Clamping keeps
        // sub-unit values on the no-suffix path (0.5 -> "0.5") and pins huge
        // ones to the largest suffix (1e15 -> "1000T").
        const magnitude = Math.min(
            Math.max(Math.floor(Math.log10(Math.abs(number)) / 3), 0),
            suffixes.length - 1
        );

        if (magnitude === 0) {
            return String(number);
        }

        const scaled = number / Math.pow(10, magnitude * 3);
        const roundedScaled = Number(scaled.toPrecision(significantDigits));
        return String(roundedScaled) + suffixes[magnitude];
    }

}.initThisClass());
