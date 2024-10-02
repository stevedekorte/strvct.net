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

}).initThisCategory();