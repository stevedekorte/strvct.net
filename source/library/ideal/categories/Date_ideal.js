"use strict";

/** * @module library.ideal
 */

/** * @class Date_ideal
 * @extends Date
 * @description Extended Date class with additional utility methods.
 
 
 */

(class Date_ideal extends Date {

    static looksLikeAStandardDateFormat (str) {
        const patterns = [
            // ISO
            /^YYYY[-/]MM[-/]DD$/,
            /^YYYY[-/]MM[-/]DD HH:mm:ss$/,
            // US
            /^MM\/DD\/YYYY$/,
            /^M\/D\/YY$/,
            /^MM\/DD\/YYYY h:mm A$/,    // e.g. 03/05/2025 8:30 PM
            // European
            /^DD\.MM\.YYYY$/,
            /^D\.M\.YY$/,
            // Hybrid with time
            /^YYYY[-/]MM[-/]DD[T ]HH:mm:ss$/,  // e.g. 2025-06-25T14:30:00 or space
            // Locale‐agnostic numeric
            /^YYYYMMDD$/,
            // RFC‐style tokens (lowercase)
            /^yyyy[-/]MM[-/]dd$/,
            /^dd[-/]MM[-/]yyyy$/,
        ];

        return patterns.some(rx => rx.test(str));
    }

    /**
     * @description Coerces a timestamp of unknown shape to epoch milliseconds.
     *
     * Backend timestamps arrive in whatever shape the transport left them in:
     * a Firestore Timestamp (toMillis), a Date (getTime), a seconds/nanos pair
     * (what a Timestamp degrades into once it crosses JSON or structured
     * clone — the prototype, and therefore toMillis, is gone), an ISO string,
     * or already-millis. Consumers that store these in Number slots or compare
     * them with `>` need one place that flattens all of it.
     *
     * Returns null for anything it cannot interpret — including an
     * unrecognized object shape, which it reports once per shape so the
     * offending payload names itself in the log instead of silently becoming
     * null. (A slot that nulls its timestamp makes an item look never-synced,
     * which re-uploads it on every startup; a raw object in a `>` comparison
     * is always false, which makes cloud updates silently never apply.)
     *
     * @param {*} value - Millis, Date, Firestore Timestamp, {seconds,nanoseconds}, ISO string, or null.
     * @returns {Number|null} Epoch milliseconds, or null if uninterpretable.
     * @category Time
     */
    static asMillis (value) {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === "number") {
            return Number.isFinite(value) ? value : null;
        }

        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed === "") {
                return null;
            }
            if (/^-?\d+$/.test(trimmed)) {
                return Number(trimmed);
            }
            const parsed = Date.parse(trimmed);
            return Number.isNaN(parsed) ? null : parsed;
        }

        if (typeof value === "object") {
            // Firestore Timestamp, or anything else exposing the same contract
            if (typeof value.toMillis === "function") {
                return Date.asMillis(value.toMillis());
            }
            // Date, or anything date-like
            if (typeof value.getTime === "function") {
                return Date.asMillis(value.getTime());
            }
            // A Timestamp that lost its prototype crossing JSON / structured
            // clone. Both spellings appear in the wild: the client SDK uses
            // seconds/nanoseconds, the admin SDK's toJSON uses _seconds/_nanoseconds.
            const seconds = value.seconds !== undefined ? value.seconds : value._seconds;
            const nanos = value.nanoseconds !== undefined ? value.nanoseconds : value._nanoseconds;
            if (typeof seconds === "number") {
                return seconds * 1000 + (typeof nanos === "number" ? Math.floor(nanos / 1e6) : 0);
            }
        }

        this.warnOnceAboutUninterpretableTimestamp(value);
        return null;
    }

    /**
     * @description Reports an uninterpretable timestamp shape once per shape,
     * so a recurring bad payload names itself without flooding the console.
     * @param {*} value - The value asMillis could not interpret.
     * @category Time
     */
    static warnOnceAboutUninterpretableTimestamp (value) {
        if (!this._warnedTimestampShapes) {
            this._warnedTimestampShapes = new Set();
        }
        const constructorName = (value && value.constructor && value.constructor.name) || "(none)";
        const keys = (typeof value === "object") ? Object.keys(value).sort().join(",") : "";
        const shape = typeof value + "/" + constructorName + "/" + keys;
        if (this._warnedTimestampShapes.has(shape)) {
            return;
        }
        this._warnedTimestampShapes.add(shape);
        console.warn("[Date.asMillis] uninterpretable timestamp — returning null." +
            " typeof: " + typeof value +
            ", constructor: " + constructorName +
            ", keys: [" + keys + "]");
    }

    /**
     * @returns {Date} A shallow copy of the current Date object.
     * @category Utility
     */
    copy () {
        return this.shallowCopy();
    }

    /**
     * @returns {Date} A new Date object with the same time as the current one.
     * @category Utility
     */
    shallowCopy () {
        return new Date(this.getTime());
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
        const monthNumber = this.getMonth() - 1;
        return this.monthNames()[monthNumber];
    }

    /**
     * @returns {string} The date number with its ordinal suffix (e.g., "1st", "2nd", "3rd", "4th").
     * @category Formatting
     */
    dateNumberName () {
        const dayNumber = this.getDate();
        return dayNumber + dayNumber.ordinalSuffix();
    }

    /**
     * Pads a number with a leading zero if it's a single digit.
     * @param {number} n - The number to pad.
     * @returns {string} The padded number as a string.
     * @category Formatting
     */
    paddedNumber (n) {
        const s = "" + n;
        if (s.length === 1) {
            return "0" + s;
        }
        return s;
    }

    /**
     * @returns {string} The hours padded with a leading zero if necessary.
     * @category Formatting
     */
    zeroPaddedHours () {
        return this.paddedNumber(this.getHours());
    }

    /**
     * @returns {string} The minutes padded with a leading zero if necessary.
     * @category Formatting
     */
    zeroPaddedMinutes () {
        return this.paddedNumber(this.getMinutes());
    }

    /**
     * @returns {string} The seconds padded with a leading zero if necessary.
     * @category Formatting
     */
    zeroPaddedSeconds () {
        return this.paddedNumber(this.getSeconds());
    }

    /**
     * @returns {number} The hours in 12-hour format (1-12).
     * @category Formatting
     */
    getTwelveHours () {
        let h = this.getHours();
        if (h > 12) { h -= 12; }
        if (h === 0) { h = 12; }
        return h;
    }

    /**
     * @returns {string} The time in US format (HH:MM) with zero-padded hours and minutes.
     * @category Formatting
     */
    zeroPaddedUSDate () {
        return this.paddedNumber(this.getTwelveHours()) + ":" + this.paddedNumber(this.getMinutes());
    }


}).initThisCategory();
