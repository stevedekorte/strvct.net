"use strict";


/**
 * @class Number_random
 * @extends Number
 * @description Extended Number class with additional random utility methods.
 */

import { crypto } from "crypto";

(class Number_random extends Number {

    static randomUint32 () {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        return a[0] >>> 0;
    }

}).initThisCategory();
