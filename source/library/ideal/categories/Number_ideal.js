"use strict";

/**
 * @module library.ideal
 * @namespace Base64
 * @description Utility for converting between integers and base64 strings
 * @private
 */
const Base64 = (function () {
    const digitsStr = 
    //   0       8       16      24      32      40      48      56     63
    //   v       v       v       v       v       v       v       v      v
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    let digits = digitsStr.split("");
    let digitsMap = {};
    for (let i = 0; i < digits.length; i++) {
        digitsMap[digits[i]] = i;
    }
    return {
        fromInt (int32) {
            let result = "";
            while (true) {
                result = digits[int32 & 0x3f] + result;
                int32 >>>= 6;
                if (int32 === 0) {
                    break;
                }
            }
            return result;
        },
        toInt (digitsStr) {
            let result = 0;
            const digits = digitsStr.split("");
            for (let i = 0; i < digits.length; i++) {
                result = (result << 6) + digitsMap[digits[i]];
            }
            return result;
        }
    };
})();

/**
 * @class Number_ideal
 * @extends Number
 * @description Extended Number class with additional utility methods.
 */
(class Number_ideal extends Number {

    /**
     * Returns a duplicate of the number (which is the number itself for primitives)
     * @returns {number} The number
     * @category Duplication
     */
    duplicate () {
        return this;
    }
    
    /**
     * Returns a copy of the number (which is the number itself for primitives)
     * @returns {number} The number
     * @category Duplication
     */
    copy () {
        return this;
    }

    /**
     * Returns a shallow copy of the number (which is the number itself for primitives)
     * @returns {number} The number
     * @category Duplication
     */
    shallowCopy () {
        return this;
    }

    /**
     * Checks if the number is equal to another number
     * @param {number} other - The other number to compare
     * @returns {boolean} True if the numbers are equal, false otherwise
     * @category Comparison
     */
    isEqual (other) {
        return this === other;
    }

    /**
     * Repeats a function the number of times specified by this number
     * @param {function(number): (boolean|void)} func - The function to repeat
     * @returns {Number_ideal} This number instance
     * @category Iteration
     */
    repeat (func) {
        for (let i = 0; i < this; i++) {
            if (func(i) === false) {
                return this;
            }
        }
        return this;
    }

    /**
     * Iterates from 0 to this number (exclusive), calling the provided function for each number
     * @param {function(number): void} func - The function to call for each number
     * @category Iteration
     */
    forEach (func) {
        assert(Number.isInteger(this))
        for (let i = 0; i < this; i++) {
            func(i);
        }
    }

    /**
     * Iterates from this number - 1 to 0, calling the provided function for each number
     * @param {function(number): void} func - The function to call for each number
     * @category Iteration
     */
    reverseForEach (func) {
        assert(Number.isInteger(this))
        for (let i = this - 1; i >= 0; i--) {
            func(i);
        }
    }

    /**
     * Throws an error if called (placeholder for potential future implementation)
     * @throws {Error} Always throws an error
     * @category Uncategorized
     */
    map () {
        throw new Error("Number map is actually used?");
    }

    /**
     * Checks if the number is even
     * @returns {boolean} True if the number is even, false otherwise
     * @category Arithmetic
     */
    isEven () {
        return this % 2 === 0;
    }

    /**
     * Checks if the number is odd
     * @returns {boolean} True if the number is odd, false otherwise
     * @category Arithmetic
     */
    isOdd () {
        return this % 2 !== 0;
    }

    /**
     * Returns the ordinal suffix for the number
     * @returns {string} The ordinal suffix ('st', 'nd', 'rd', or 'th')
     * @category Formatting
     */
    ordinalSuffix () {
        const i = this;
        let j = i % 10;
        let k = i % 100;
        
        if (j === 1 && k !== 11) {
            return "st";
        }
        if (j === 2 && k !== 12) {
            return "nd";
        }
        if (j === 3 && k !== 13) {
            return "rd";
        }
        return "th";
    }

    /**
     * Converts the number to a base64 string
     * @returns {string} The base64 representation of the number
     * @category Conversion
     */
    toBase64 () {
        return Base64.fromInt(this);
    }

    /**
     * Converts a base64 string to a number
     * @param {string} base64String - The base64 string to convert
     * @returns {number} The number represented by the base64 string
     * @category Conversion
     */
    fromBase64 (base64String) {
        // need to call like: 
        // Number.prototype.fromBase64("...")
        return Base64.toInt(base64String);
    }

    /**
     * Returns a human-readable string describing the byte size
     * @returns {string} A formatted string representing the byte size
     * @category Formatting
     */
    byteSizeDescription () {
        return ByteFormatter.clone().setValue(this).formattedValue();
    }

    /**
     * Returns the number with its ordinal indicator
     * @returns {string} The number followed by its ordinal indicator
     * @category Formatting
     */
    withOrdinalIndicator () {
        return this + "" + this.ordinalIndicator()
    }

    /**
     * Returns the ordinal indicator for the number
     * @returns {string} The ordinal indicator ('st', 'nd', 'rd', or 'th')
     * @category Formatting
     */
    ordinalIndicator () {
        const num = this;

        if (typeof num !== 'number' || isNaN(num) || !Number.isInteger(num)) {
            return '';
        }
    
        const lastDigit = num % 10;
        const lastTwoDigits = num % 100;
    
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return 'th';
        }
    
        switch (lastDigit) {
            case 1:
                return 'st';
            case 2:
                return 'nd';
            case 3:
                return 'rd';
            default:
                return 'th';
        }
    }

    /**
     * Returns a string representation of the number as a count for a given label
     * @param {string} label - The label to use for the count
     * @returns {string} A formatted string representing the count
     * @category Formatting
     */
    asCountForLabel (label) {
        const count = this;
        if (count === 0) {
            return "no " + label + "s";
        } else if (count === 1) {
            return count + " " + label;
        } 
        return count + " " + label + "s";
    }

    /**
     * Returns a random number between this number and another number
     * @param {number} other - The other number to use as a range boundary
     * @returns {number} A random number between this number and the other number
     * @category Random
     */
    randomBetween (other) {
        const min = Math.min(this, other);
        const max = Math.max(this, other);
        const randomValue = Math.random() * (max - min) + min;
        return randomValue;
    }


    hashCode () {
        return this;
    }

    hashCode64 () {
        return this;
    }

    asString () {
        return this.toString();
    }
    
}).initThisCategory();