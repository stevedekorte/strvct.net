"use strict";

Type.typedArrayTypeNames().forEach((name) => {
    const aClass = window[name]

    if (Type.isUndefined(aClass)) {
        console.warn("TypeArray-store error: missing type " + name)
        return
    }

    // add some class methods
    /*
    Object.defineSlots(aClass, {

    })
    */

    // add some object methods

    Object.defineSlots(aClass.prototype, {

        base64Encoded: function(aRecord, aStore) {
            return btoa(String.fromCharCode.apply(null, new Uint8Array(this)));
        },

    })

})

Object.defineSlots(ArrayBuffer.prototype, {

    base64Encoded: function(aRecord, aStore) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(this)));
    },

})

//console.log("base64Encoded test:", new Uint32Array([1, 2, 3]).base64Encoded())