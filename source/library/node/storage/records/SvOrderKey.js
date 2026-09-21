"use strict";

/**
 * @module library.node.storage.records
 * @class SvOrderKey
 * @extends ProtoClass
 * @classdesc Fractional order keys (Plans/Record Store §11): base-62 digit
 * strings that sort bytewise, with a key between any two keys. A key is the
 * fractional part of a number in [0, 1): "V" is one half, "F" a quarter.
 * Append = a key after the last, insert = the midpoint, delete = nothing.
 * Keys grow one digit per insertion at the same spot; a collection whose
 * longest key passes a threshold rewrites its keys evenly (the caller's job).
 */
(class SvOrderKey extends ProtoClass {

    static digits () {
        return "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    }

    static base () {
        return this.digits().length;
    }

    static digitValue (character) {
        const value = this.digits().indexOf(character);
        assert(value >= 0, "not an order key digit: '" + character + "'");
        return value;
    }

    /**
     * @description A key strictly between a and b; null a means the beginning,
     * null b means the end.
     * @param {String|null} a
     * @param {String|null} b
     * @returns {String}
     * @category Keys
     */
    static keyBetween (a, b) {
        const lower = a || "";
        if (b !== null && b !== undefined) {
            assert(lower < b, "order keys must be ordered: '" + lower + "' < '" + b + "'");
            return this.midpoint(lower, b);
        }
        return this.keyAfter(lower);
    }

    static keyAfter (a) {
        if (a.length === 0) {
            return "V";
        }
        const last = this.digitValue(a[a.length - 1]);
        if (last < this.base() - 1) {
            return a.slice(0, -1) + this.digits()[last + 1];
        }
        return a + "V";
    }

    /**
     * @description The midpoint of two keys as base-62 fractions, extended by one
     * digit when the fractions are adjacent.
     * @category Keys
     */
    static midpoint (a, b) {
        const length = Math.max(a.length, b.length);
        const av = this.valuesOf(a, length);
        const bv = this.valuesOf(b, length);
        const sum = this.addValues(av, bv);        // length + 1 digits, most significant first
        const half = this.halve(sum);               // length + 1 digits (one more fractional digit)
        const key = this.trimmed(this.stringOf(half));
        if (key <= a) {
            return a + "V"; // adjacent: a and b differ by one unit at the last digit
        }
        return key;
    }

    static valuesOf (key, length) {
        const values = [];
        for (let i = 0; i < length; i++) {
            values.push(i < key.length ? this.digitValue(key[i]) : 0);
        }
        return values;
    }

    static addValues (av, bv) {
        const base = this.base();
        const result = new Array(av.length + 1).fill(0);
        let carry = 0;
        for (let i = av.length - 1; i >= 0; i--) {
            const sum = av[i] + bv[i] + carry;
            result[i + 1] = sum % base;
            carry = Math.floor(sum / base);
        }
        result[0] = carry; // the integer digit of a + b (0 or 1)
        return result;
    }

    static halve (values) {
        const base = this.base();
        const result = [];
        let remainder = 0;
        values.forEach((digit) => {
            const current = remainder * base + digit;
            result.push(Math.floor(current / 2));
            remainder = current % 2;
        });
        result.push(remainder === 1 ? base / 2 : 0); // a leftover half becomes one more digit
        return result.slice(1); // drop the integer digit, which is 0 after halving a sum < 2
    }

    static stringOf (values) {
        return values.map(v => this.digits()[v]).join("");
    }

    static trimmed (key) {
        let end = key.length;
        while (end > 1 && key[end - 1] === "0") {
            end--;
        }
        return key.slice(0, end);
    }

}.initThisClass());
