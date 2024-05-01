"use strict";

/*

    Range_ideal

    Some extra methods for the Javascript Range primitive.

*/

(class Range_ideal extends Range {
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

    