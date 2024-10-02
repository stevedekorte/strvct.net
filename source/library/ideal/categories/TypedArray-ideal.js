"use strict";

/** 
 * @module library.ideal
    Some code for adding categories to all the typed array types. 

*/

Type.typedArrayTypeNames().forEach((name) => {
    const aClass = getGlobalThis()[name]

    if (Type.isUndefined(aClass)) {
        console.warn("TypeArray-store error: missing type " + name);
        return;
    }

    /*
    Object.defineSlots(aClass, { // class methods
    })
    */

    Object.defineSlots(aClass.prototype, { // instance methods
        /**
         * @category Encoding
         */
        base64Encoded: function(aRecord, aStore) {
            return btoa(String.fromCharCode.apply(null, new Uint8Array(this)));
        },
    })

});

Object.defineSlots(ArrayBuffer.prototype, { // TODO: move to ArrayBuffer_ideal
    /**
     * @category Encoding
     */
    base64Encoded: function (aRecord, aStore) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(this)));
    },

    /**
     * @category Cryptography
     */
    promiseSha256Digest: function () {
        return crypto.subtle.digest("SHA-256", this);
     }
});

//console.log("base64Encoded test:", new Uint32Array([1, 2, 3]).base64Encoded())