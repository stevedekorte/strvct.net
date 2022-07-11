"use strict";

/*

    SubnodesArray

    Just here to avoid name changes for array type used in BMNode.

*/

(class SubnodesArray extends SortedArray {

    static from (oldArray) {
        const newArray = this.clone()
        oldArray.forEach(v => newArray.push(v)) // make sure any method hooks are called
        return newArray
    }

}.initThisClass());