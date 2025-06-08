/**
 * @module library.node.fields.subclasses
 */

"use strict";

/**
 * @class SvDateField
 * @extends SvField
 * @classdesc A named date field.
 */

(class SvDateField extends SvField {
     
    /**
     * @static
     * @returns {boolean} True if available as a node primitive
     * @category Utility
     */
    static availableAsNodePrimitive () {
        return true
    }

    /**
     * @description Initialize prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {string} unsetVisibleValue
         * @category UI
         */
        {
            const slot = this.newSlot("unsetVisibleValue", "unset");
            slot.setSlotType("String");
        }

        /**
         * @member {string} dateFormat
         * @category UI
         */
        {
            const slot = this.newSlot("dateFormat", "YYYY-MM-DD");
            slot.setSlotType("String");
        }

        /**
         * @member {Number} year
         * @category Subnodes
         */
        {
            const slot = this.newSlot("year", null);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setSummaryFormat("none");
        }

        /**
         * @member {Number} month
         * @category Subnodes
         */
        {
            const slot = this.newSlot("month", null);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setSummaryFormat("none");
        }

        /**
         * @member {Number} day
         * @category Subnodes
         */
        {
            const slot = this.newSlot("day", null);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setSummaryFormat("none");
        }
    }

    /**
     * @description Initialize prototype
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStoreSubnodes(false);
    }

    // ----

    /**
     * @description Initialize the instance
     * @category Initialization
     */
    init () {
        super.init()
        this.setKey("Date title")
        this.setKeyIsEditable(false)
        this.setValueIsEditable(true)
        this.setupSubnodeFields()
        this.setValue(Date.now())
    }

    /**
     * @description Setup the subnode fields for year, month, and day
     * @category Initialization
     */
    setupSubnodeFields () {
        // Set initial values
        const now = new Date();
        this.setYear(now.getFullYear());
        this.setMonth(now.getMonth() + 1);
        this.setDay(now.getDate());
    }

    /**
     * @description Check if a year is a leap year
     * @param {number} year - The year to check
     * @returns {boolean} True if the year is a leap year
     * @category Validation
     */
    isLeapYear (year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    /**
     * @description Get the number of days in a month
     * @param {number} year - The year
     * @param {number} month - The month (1-12)
     * @returns {number} The number of days in the month
     * @category Validation
     */
    getDaysInMonth (year, month) {
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (month === 2 && this.isLeapYear(year)) {
            return 29;
        }
        return daysInMonth[month - 1];
    }

    /**
     * @description Validate a year value
     * @param {number} year - The year to validate
     * @returns {string|null} Error message if invalid, null if valid
     * @category Validation
     */
    validateYear (year) {
        if (!Type.isNumber(year)) {
            return "Year must be a number";
        }
        if (year < 1900 || year > 2100) {
            return "Year must be between 1900 and 2100";
        }
        return null;
    }

    /**
     * @description Validate a month value
     * @param {number} month - The month to validate
     * @returns {string|null} Error message if invalid, null if valid
     * @category Validation
     */
    validateMonth (month) {
        if (!Type.isNumber(month)) {
            return "Month must be a number";
        }
        if (month < 1 || month > 12) {
            return "Month must be between 1 and 12";
        }
        return null;
    }

    /**
     * @description Validate a day value
     * @param {number} day - The day to validate
     * @returns {string|null} Error message if invalid, null if valid
     * @category Validation
     */
    validateDay (day) {
        if (!Type.isNumber(day)) {
            return "Day must be a number";
        }
        const year = this.year();
        const month = this.month();
        const daysInMonth = this.getDaysInMonth(year, month);
        if (day < 1 || day > daysInMonth) {
            return `Day must be between 1 and ${daysInMonth} for the selected month`;
        }
        return null;
    }

    /**
     * @description Update the date value based on the year, month, and day fields
     * @category Data Manipulation
     */
    updateDateFromFields () {
        const year = this.year();
        const month = this.month();
        const day = this.day();

        // Only update if all fields are valid
        if (year && month && day) {
            const yearError = this.validateYear(year);
            const monthError = this.validateMonth(month);
            const dayError = this.validateDay(day);

            if (!yearError && !monthError && !dayError) {
                const date = new Date(year, month - 1, day);
                this.setValue(date.getTime());
            }
        }
    }

    /**
     * @description Update the year, month, and day fields based on the current date value
     * @category Data Manipulation
     */
    updateFieldsFromDate () {
        const date = this.dateValue();
        if (date) {
            this.setYear(date.getFullYear());
            this.setMonth(date.getMonth() + 1);
            this.setDay(date.getDate());
        } else {
            this.setYear(null);
            this.setMonth(null);
            this.setDay(null);
        }
    }

    /**
     * @description Set the value of the field
     * @param {*} v - The value to set
     * @returns {SvDateField} The instance
     * @category Data Manipulation
     */
    setValue (v) {
        if (Type.isNull(v) && this.valueAllowsNull()) {
            super.setValue(null);
        } else {
            // Convert to timestamp
            let timestamp;
            if (v instanceof Date) {
                timestamp = v.getTime();
            } else if (Type.isNumber(v)) {
                timestamp = v;
            } else {
                timestamp = new Date(v).getTime();
            }
            
            if (isNaN(timestamp)) {
                throw new Error("Invalid date value");
            }
            super.setValue(timestamp);
        }
        this.updateFieldsFromDate();
        return this;
    }

    /**
     * @description Get the date value as a Date object
     * @returns {Date} The date value
     * @category Data Access
     */
    dateValue () {
        const timestamp = this.value();
        return timestamp ? new Date(timestamp) : null;
    }

    /**
     * @description Get the formatted date string
     * @returns {string} The formatted date string
     * @category Data Access
     */
    formattedValue () {
        const date = this.dateValue();
        if (!date) {
            return this.unsetVisibleValue();
        }
        // Basic date formatting - can be enhanced with a proper date formatting library
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
	
    /**
     * @description Validate the field value
     * @returns {boolean} True if the value is valid
     * @category Validation
     */
    validate () {
        const timestamp = this.value();
        const errors = [];
        
        if (timestamp === null && !this.valueAllowsNull()) {
            errors.push("Date is required.");
        } else if (timestamp !== null) {
            if (!Type.isNumber(timestamp)) {
                errors.push("Value must be a valid timestamp.");
            } else if (isNaN(timestamp)) {
                errors.push("Invalid date value.");
            }
        }

        if (errors.length) {
            this.setValueError(errors.join("\n"));
        } else {
            this.setValueError(null);
        }
        
        return this.valueError() === null;
    }
    
}.initThisClass());