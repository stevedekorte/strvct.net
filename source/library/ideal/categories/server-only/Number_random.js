"use strict";


/**
 * @class Number_random
 * @extends Number
 * @description Extended Number class with additional random utility methods.
 */

// crypto is a global in both browsers and Node 19+; the CAM loader cannot
// evaluate ES import statements, so no import here.

(class Number_random extends Number {

    static randomUint32 () {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        return a[0] >>> 0;
    }

}).initThisCategory();
