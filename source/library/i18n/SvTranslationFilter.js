"use strict";

/**
 * @module library.i18n
 */

/**
 * @class SvTranslationFilter
 * @extends ProtoClass
 * @classdesc Determines whether a string value needs translation.
 * Uses a pluggable map of named filter functions. Each function takes a trimmed
 * string and returns true if it should NOT be translated.
 *
 * Built-in filters cover numbers, currency, codes, emails, URLs, etc.
 * Applications can add domain-specific filters via addFilter().
 * Names prevent duplicate registration.
 *
 * Usage:
 *   SvTranslationFilter.shared().shouldTranslate("Hello") // true
 *   SvTranslationFilter.shared().shouldTranslate("$9.99") // false
 *   SvTranslationFilter.shared().addFilter("diceNotation", s => /^\d+d\d+/.test(s));
 */

(class SvTranslationFilter extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {

        /**
         * @member {Map} filters
         * @description Map of filter name → filter function. Each function takes a
         * trimmed string and returns true if the string should NOT be translated.
         * Names prevent duplicate registration.
         * @category Filtering
         */
        {
            const slot = this.newSlot("filters", null);
            slot.setSlotType("Map");
        }
    }

    init () {
        super.init();
        this.setFilters(new Map());
        this.addDefaultFilters();
        return this;
    }

    /**
     * @description Registers the built-in filter functions.
     * @returns {SvTranslationFilter}
     * @category Setup
     * @private
     */
    addDefaultFilters () {
        this.addFilter("hasNoLetters", s => this.hasNoLetters(s));
        this.addFilter("numericOrCurrency", s => this.isNumericOrCurrency(s));
        this.addFilter("alphanumericCode", s => this.isAlphanumericCode(s));
        this.addFilter("ordinal", s => this.isOrdinal(s));
        this.addFilter("labeledNumeric", s => this.isLabeledNumeric(s));
        this.addFilter("email", s => this.isEmail(s));
        this.addFilter("phoneNumber", s => this.isPhoneNumber(s));
        this.addFilter("url", s => this.isUrl(s));
        this.addFilter("ipAddress", s => this.isIpAddress(s));
        return this;
    }

    /**
     * @description Adds a named filter function. If a filter with the same name
     * already exists, it is replaced.
     * @param {String} name - Unique name for the filter.
     * @param {Function} filterFunc - Takes a trimmed string, returns true if it should NOT be translated.
     * @returns {SvTranslationFilter}
     * @category Filtering
     */
    addFilter (name, filterFunc) {
        this.filters().set(name, filterFunc);
        return this;
    }

    /**
     * @description Removes a filter by name.
     * @param {String} name - The filter name to remove.
     * @returns {SvTranslationFilter}
     * @category Filtering
     */
    removeFilter (name) {
        this.filters().delete(name);
        return this;
    }

    /**
     * @description Returns true if the value should be translated.
     * Returns false if any filter function matches (i.e. says "don't translate").
     * @param {String} value - The string to test.
     * @returns {Boolean}
     * @category Filtering
     */
    shouldTranslate (value) {
        if (!value || typeof value !== "string") {
            return false;
        }

        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return false;
        }

        const filters = this.filters();
        for (const [name, fn] of filters) {
            if (fn(trimmed)) {
                return false;
            }
        }

        return true;
    }

    // --- Built-in filter functions ---

    /**
     * @description Strings with no alphabetical characters (a-z, A-Z).
     * Matches: "17 (+3)", "+5 / +3 / +2", "15, 12, 10, 8", "---"
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    hasNoLetters (trimmed) {
        return !/[a-zA-Z]/.test(trimmed);
    }

    /**
     * @description Numbers and currency amounts.
     * Matches: "42", "-3.14", "1,000", "$9.99", "€100", "100%", "$70.16 USD"
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    isNumericOrCurrency (trimmed) {
        // Strip leading currency symbols and whitespace
        // Covers $, €, £, ¥, ₹, ₩, ₽, ₿ and common currency signs
        const stripped = trimmed.replace(/^[\$\u20AC\u00A3\u00A5\u20B9\u20A9\u20BD\u20BF\s]+/, "")
            .replace(/\s*[A-Z]{2,4}$/, ""); // Strip trailing currency codes (USD, EUR, etc.)
        return /^[+-]?[\d][\d,.']*[%]?$/.test(stripped);
    }

    /**
     * @description Short alphanumeric codes with no translatable word runs.
     * A "word run" is 3+ consecutive letters (e.g. "Hit" is translatable, "A2" is not).
     * Matches: "23A", "#7", "B2", "3d6", "+5", "10/20", "2:30"
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    isAlphanumericCode (trimmed) {
        return trimmed.length <= 10 && !/[a-zA-Z]{3,}/.test(trimmed);
    }

    /**
     * @description Ordinal numbers.
     * Matches: "1st", "2nd", "3rd", "4th", "21st"
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    isOrdinal (trimmed) {
        return /^\d+(?:st|nd|rd|th)$/i.test(trimmed);
    }

    /**
     * @description Colon-separated label:value where the value is numeric.
     * Matches: "HP: 45", "AC: 18", "XP: 1,200"
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    isLabeledNumeric (trimmed) {
        return /^[A-Z]{1,4}:\s*[\d,.']+$/.test(trimmed);
    }

    /**
     * @description Email addresses.
     * Matches: "user@example.com", "name+tag@domain.co.uk"
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    isEmail (trimmed) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    }

    /**
     * @description Phone numbers — digits with optional +, -, (), spaces, dots.
     * Matches: "+1 (555) 123-4567", "555.123.4567", "+44 20 7946 0958"
     * Minimum 7 characters to avoid false positives on short numeric strings.
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    isPhoneNumber (trimmed) {
        return /^\+?[\d\s\-().]{7,}$/.test(trimmed);
    }

    /**
     * @description URLs and web addresses.
     * Matches: "https://example.com", "http://foo.bar/path", "www.example.com",
     * "example.com/path", "ftp://files.example.com"
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    isUrl (trimmed) {
        // Protocol-prefixed URLs
        if (/^(?:https?|ftp):\/\/\S+$/i.test(trimmed)) {
            return true;
        }
        // www-prefixed URLs
        if (/^www\.\S+$/i.test(trimmed)) {
            return true;
        }
        // Bare domain with path (e.g. "example.com/path")
        if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/\S*$/.test(trimmed)) {
            return true;
        }
        return false;
    }

    /**
     * @description IPv4 and IPv6 addresses.
     * Matches: "192.168.1.1", "10.0.0.1", "::1", "2001:db8::1", "fe80::1%eth0"
     * @param {String} trimmed - The trimmed string to test.
     * @returns {Boolean}
     * @category Patterns
     */
    isIpAddress (trimmed) {
        // IPv4
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) {
            return true;
        }
        // IPv6 (simplified — hex groups with colons, optional :: compression)
        if (/^[0-9a-fA-F:]+$/.test(trimmed) && trimmed.includes(":")) {
            return true;
        }
        return false;
    }

}).initThisClass();
