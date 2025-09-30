"use strict";

/**
 * Takes a number and returns a string with a more human readable format.
 *
 * @example
 * const stringVersion = NumberFormatter.clone().setValue(1234).setSignificantDigits(2).formattedValue();
 * // stringVersion will be "1.2K"
 *
 * @module library.ideal.formatters
 * @class NumberFormatter
 * @extends ProtoClass
 */
(class NumberFormatter extends ProtoClass {
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

        const suffixes = ["", "K", "M", "B", "T"];
        const magnitude = Math.floor(Math.log10(Math.abs(number)) / 3);
        const scaled = number / Math.pow(10, magnitude * 3);

        if (magnitude === 0) {
            return number.toString();
        } else {
            const roundedScaled = Number(scaled.toPrecision(significantDigits));
            return roundedScaled + suffixes[magnitude];
        }
    }

}.initThisClass());
