"use strict";

/**
 * @module library.ideal.formatters
 * @class ByteFormatter
 * @extends ProtoClass
 * @classdesc ByteFormatter takes a number of bytes and returns a string with the order of magnitude in
 * standard SI decimal digital information format.
 * Example:
 * const stringVersion = ByteFormatter.clone().setValue(aNumberOfBytes).formattedValue()
 *
 * // Output examples:
 * // if aNumberOfBytes was 300, stringVersion would be 300 bytes.
 * // if aNumberOfBytes was 3,000, stringVersion would be 3 kB.
 * // if aNumberOfBytes was 30,000, stringVersion would be 30 kB.
 * // if aNumberOfBytes was 300,000, stringVersion would be 300 kB.
 * // if aNumberOfBytes was 3,000,000, stringVersion would be 3 MB.
 *
 * Todo: Move to power notation after max order name exceeded
 */

(class ByteFormatter extends ProtoClass {
    initPrototypeSlots () {

        /**
         * @description The number of bytes to format.
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
         * @description Whether to use a postfix in the formatted output.
         * @type {boolean}
         * @default true
         * @member {boolean} usePostfix
         * @category Formatting
         */
        {
            const slot = this.newSlot("usePostfix", true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to use a space between the number and the unit in the formatted output.
         * @type {boolean}
         * @default false
         * @member {boolean} useSpace
         * @category Formatting
         */
        {
            const slot = this.newSlot("useSpace", false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description Whether to use long names for units in the formatted output.
         * @type {boolean}
         * @default false
         * @member {boolean} useLongNames
         * @category Formatting
         */
        {
            const slot = this.newSlot("useLongNames", false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
        }

        /**
         * @description Array of short unit names.
         * @type {string[]}
         * @member {string[]} orderNamesShort
         * @category Data
         */
        {
            const slot = this.newSlot("orderNamesShort", [
                "bytes",
                "k",
                "M",
                "G",
                "T",
                "P",
                "E",
                "Z",
                "Y"
            ]);
            slot.setSlotType("Array");
        }

        /**
         * @description Array of long unit names.
         * @type {string[]}
         * @member {string[]} orderNamesLong
         * @category Data
         */
        {
            const slot = this.newSlot("orderNamesLong", [
                "bytes",
                "kilobytes",
                "megabytes",
                "gigabytes",
                "terabytes",
                "petabytes",
                "exabytes",
                "zettabytes",
                "yottabytes"
            ]);
            slot.setSlotType("Array");
        }
    }

    initPrototype () {
    }

    /**
     * @description Formats the byte value into a human-readable string.
     * @returns {string} The formatted byte value.
     * @category Formatting
     */
    formattedValue () {
        const b = Math.floor(this.value());
        let postfix = this.usePostfix() ? "B" : "";
        let space = this.useSpace() ? " " : "";

        const orderNames = this.useLongNames() ? this.orderNamesLong() : this.orderNamesShort();
        let order = b === 0 ? 0 : Math.floor(Math.log10(b) / 3);
        order = Math.min(order, orderNames.length - 1);
        let orderName = orderNames[order];

        if (order === 0 || this.useLongNames()) {
            space = " ";
            postfix = "";
        }

        const v = Math.floor(b / Math.pow(10, order * 3));

        // remove plural if v === 1
        if (orderName[orderName.length - 1] === "s" && v === 1) {
            orderName = orderName.substring(0, orderName.length - 1);
        }

        return v + space + orderName + postfix;
    }
}.initThisClass());
