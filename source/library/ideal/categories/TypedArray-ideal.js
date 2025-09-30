"use strict";

/**
 * @module library.ideal
 * @description Some code for adding categories to all the typed array types.
 * TODO: this adds methods to all the typed array types, so we'll need to document
 * each separately to get the jsdoc to work.
 *
*/

Type.typedArrayTypeNames().forEach((name) => {
    const aClass = SvGlobals.get(name);

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
         * @memberof TypedArray.prototype
         * @method base64Encoded
         * @returns {string} The base64 encoded string.
         * @category Encoding
         */
        base64Encoded: function (/*aRecord, aStore*/) {
            return btoa(String.fromCharCode.apply(null, new Uint8Array(this)));
        },

        promiseSha256Digest: async function () {
            return await crypto.subtle.digest("SHA-256", this);
        }
    });

});

Object.defineSlots(ArrayBuffer.prototype, { // TODO: move to ArrayBuffer_ideal
    /**
     * @memberof ArrayBuffer.prototype
     * @method base64Encoded
     * @returns {string} The base64 encoded string.
     * @category Encoding
     */
    base64Encoded: function (/*aRecord, aStore*/) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(this)));
    },

    /**
     * @category Cryptography
     */
    promiseSha256Digest: async function () {
        return await crypto.subtle.digest("SHA-256", this);
    }
});

//console.log("base64Encoded test:", new Uint32Array([1, 2, 3]).base64Encoded())
