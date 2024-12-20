"use strict";

/**
 * TimePeriodFormatter takes a number of seconds and formats it in a compact format.
 *
 * @example
 * const stringVersion = TimePeriodFormatter.clone().setValueInSeconds(seconds).formattedValue()
 *
 * @example
 * // Output examples:
 * // if seconds was 10, stringVersion would be 10s.
 * // if seconds was 60, stringVersion would be 1m.
 * // if seconds was 3600, stringVersion would be 1h.
 * // if seconds was 172800, stringVersion would be 2d.
 *
 * @module library.ideal.formatters
 * @class TimePeriodFormatter
 * @extends ProtoClass
 */
(class TimePeriodFormatter extends ProtoClass {
    initPrototypeSlots () {
        /**
         * @description The number of seconds to format.
         * @type {number}
         * @default 0
         * @member {number} valueInSeconds
         * @category Data
         */
        {
            const slot = this.newSlot("valueInSeconds", 0);
            slot.setSlotType("Number");
        }

        /**
         * @description A map of time periods to their abbreviated forms.
         * @type {Map<string, string>}
         * @member {Map<string, string>} periodsMap
         * @category Configuration
         */
        {
            const slot = this.newSlot("periodsMap", new Map(Object.entries({ 
                seconds: "s", 
                minutes: "m", 
                hours: "h", 
                days: "d", 
                months: "months", 
                years: "years"
            })));
            slot.setSlotType("Object"); 
        }
    }

    /**
     * Formats the time period into a compact string representation.
     * @returns {string} The formatted time period string.
     * @method
     * @category Formatting
     */
    formattedValue () {
        const periods = this.periodsMap();

        const seconds = this.valueInSeconds();
        if (seconds === null) {
            return "?";
        }

        if (seconds < 60) {
            return Math.floor(seconds) + periods.get("seconds");
        }
        
        const minutes = Math.floor(seconds/60);
        if (minutes < 60) {
            return minutes + periods.get("minutes");
        }

        const hours = Math.floor(minutes/60);
        if (hours < 24) {
            return hours + periods.get("hours");
        }
        
        const days = Math.floor(hours/24);
        return days + periods.get("days");
    }
    
}.initThisClass());