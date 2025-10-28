"use strict";


/**
 * @class Number_random
 * @extends Number
 * @description Extended Number class with additional random utility methods.
 */


(class Number_random extends Number {

    static randomUint32 () { // from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
        const toU32 = n => (n >>> 0);
        return toU32(Math.floor(Math.random() * 0x100000000));
    }

}).initThisCategory();
