"use strict";

/**
 * @module library.ideal
 * @class Date_ideal
 * @extends Date
 * @description Extended Date class with additional utility methods.
 */
(class Date_ideal extends Date {

    /**
     * @returns {Date} A shallow copy of the current Date object.
     * @category Utility
     */
    copy () {
        return this.shallowCopy()
    }

    /**
     * @returns {Date} A new Date object with the same time as the current one.
     * @category Utility
     */
    shallowCopy () {
        return new Date(this.getTime())
    }

    // ---
   
    /**
     * @returns {string[]} An array of month names.
     * @category Localization
     */
    monthNames () {
        return [ 
            "January", "February", "March", 
            "April", "May", "June", 
            "July", "August", "September", 
            "October", "November", "December" 
        ];
    }

    /**
     * @returns {string} The name of the current month.
     * @category Localization
     */
    monthName () {
        const monthNumber = this.getMonth() - 1
        return this.monthNames()[monthNumber];
    }

    /**
     * @returns {string} The date number with its ordinal suffix (e.g., "1st", "2nd", "3rd", "4th").
     * @category Formatting
     */
    dateNumberName () {
        const dayNumber = this.getDate()
        return dayNumber + dayNumber.ordinalSuffix()
    }

    /**
     * Pads a number with a leading zero if it's a single digit.
     * @param {number} n - The number to pad.
     * @returns {string} The padded number as a string.
     * @category Formatting
     */
    paddedNumber (n) {
        const s = "" + n
        if (s.length === 1) { 
            return "0" + s
        }
        return s
    }

    /**
     * @returns {string} The hours padded with a leading zero if necessary.
     * @category Formatting
     */
    zeroPaddedHours () {
        return this.paddedNumber(this.getHours())
    }

    /**
     * @returns {string} The minutes padded with a leading zero if necessary.
     * @category Formatting
     */
    zeroPaddedMinutes () {
        return this.paddedNumber(this.getMinutes())
    }

    /**
     * @returns {string} The seconds padded with a leading zero if necessary.
     * @category Formatting
     */
    zeroPaddedSeconds () {
        return this.paddedNumber(this.getSeconds())
    }

    /**
     * @returns {number} The hours in 12-hour format (1-12).
     * @category Formatting
     */
    getTwelveHours () {
        let h = this.getHours()
        if (h > 12) { h -= 12 }
        if (h === 0) { h = 12 }
        return h
    }

    /**
     * @returns {string} The time in US format (HH:MM) with zero-padded hours and minutes.
     * @category Formatting
     */
    zeroPaddedUSDate () {
        return this.paddedNumber(this.getTwelveHours()) + ":" + this.paddedNumber(this.getMinutes())
    }

}).initThisCategory();