"use strict";

/*

    Number-ideal

    Some extra methods for the Javascript Number primitive.

*/

{

const Base64 = (function () { // FIXME: move this to a Number class method?
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

(class Number_ideal extends Number {

    duplicate () {
        return this;
    }
    
    copy () {
        return this;
    }

    shallowCopy () {
        return this;
    }

    repeat (func) {
        for (let i = 0; i < this; i++) {
            if (func(i) === false) {
                return this;
            }
        }
        return this;
    }

    forEach (func) {
        assert(Number.isInteger(this))
        for (let i = 0; i < this; i++) {
            func(i);
        }
    }

    reverseForEach (func) {
        assert(Number.isInteger(this))
        for (let i = this - 1; i >= 0; i++) {
            func(i);
        }
    }

    map () {
        const a = [];
        for (let i = 0; i < this; i++) {
            a.push(i);
        }
        return Array.prototype.map.apply(a, arguments);
    }

    isEven () {
        return this % 2 === 0;
    }

    isOdd () {
        return this % 2 !== 0;
    }

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

    toBase64 () {
        return Base64.fromInt(this);
    }

    fromBase64 (base64String) {
        // need to call like: 
        // Number.prototype.fromBase64("...")
        return Base64.toInt(base64String);
    }

    byteSizeDescription () {
        return ByteFormatter.clone().setValue(this).formattedValue();
    }
    
}).initThisCategory();

};
