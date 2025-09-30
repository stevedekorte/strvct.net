"use strict";

/**
 * @module library.ideal
 * @class Range_ideal
 * @extends Range
 * @description Extended Range class with additional utility methods.
 */
(class Range_ideal extends Range {

    /**
    * Checks if this range is equal to another range.
    * @param {Range} otherRange - The range to compare with
    * @returns {boolean} True if the ranges are equal, false otherwise
    * @category Comparison
    */
    isEqual (otherRange) {
        if (Type.isNullOrUndefined(otherRange)) {
            return false;
        }

        if (otherRange.startContainer === undefined) {
            return false;
        }

        if (this === otherRange) {
            return true;
        }

        if (
            this.startContainer !== otherRange.startContainer ||
      this.startOffset !== otherRange.startOffset ||
      this.endContainer !== otherRange.endContainer ||
      this.endOffset !== otherRange.endOffset
        ) {
            return false;
        }

        return true;
    };

    /**
   * Returns a 64-bit hash code for the range
   * @returns {number} A 64-bit hash code
   * @category Information
   */
    hashCode64 () {
        return [this.startContainer, this.startOffset, this.endContainer, this.endOffset].hashCode64();
    }

}).initThisCategory();
