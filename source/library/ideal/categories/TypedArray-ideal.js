"use strict";

/*

    Some code for adding categories to all the typed array types. 

*/

Type.typedArrayTypeNames().forEach((name) => {
    const aClass = getGlobalThis()[name]

    if (Type.isUndefined(aClass)) {
        console.warn("TypeArray-store error: missing type " + name)
        return
    }

    /*
    Object.defineSlots(aClass, { // class methods
    })
    */

    Object.defineSlots(aClass.prototype, { // instance methods
        base64Encoded: function(aRecord, aStore) {
            return btoa(String.fromCharCode.apply(null, new Uint8Array(this)));
        },
    })

})

Object.defineSlots(ArrayBuffer.prototype, { // TODO: move to ArrayBuffer_ideal
    base64Encoded: function(aRecord, aStore) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(this)));
    },
});

//console.log("base64Encoded test:", new Uint32Array([1, 2, 3]).base64Encoded())