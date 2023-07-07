"use strict";

/*

    SubnodesArray

    Just here to avoid name changes for array type used in BMNode.

*/

(class SubnodesArray extends SortedArray {
    initPrototypeSlots () {
        Object.defineSlot(this, "_owner", null);
    }

    owner () {
        return this._owner
    }

    setOwner (obj) {
        this._owner = obj
        return this
    }

    static from (oldArray) {
        const newArray = this.clone()
        oldArray.forEach(v => newArray.push(v)) // make sure any method hooks are called
        return newArray
    }

    shouldStore () {
        return true
    }

}.initThisClass());