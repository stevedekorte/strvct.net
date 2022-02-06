
"use strict";

// --- defineSlots method ----

Object.defineSlots = function(obj, dict) {
    Object.keys(dict).forEach((slotName) => {
        const slotValue = dict[slotName]
        const descriptor = {
            configurable: true,
            enumerable: false,
            value: slotValue,
            writable: true,
        }
        Object.defineProperty(obj, slotName, descriptor)
    })
}

// --- Array helpers ----

Object.defineSlots(Array.prototype, {
    removeFirst: function () {
        return this.shift();
    },

    appendItems: function (elements) {
        this.push.apply(this, elements);
        return this;
    },
})

// --- String helpers ----

Object.defineSlots(String.prototype, {

    contains: function (aString) {
        return this.indexOf(aString) !== -1;
    },

    before: function (aString) {
        const index = this.indexOf(aString);
        
        if (index === -1) {
            return this;
        }

        return this.slice(0, index);
    },

    after: function (aString) {
        const index = this.indexOf(aString);

        if (index === -1) {
            return "";
        }
        
        return this.slice(index + aString.length);
    },

    between: function (prefix, suffix) {
        const after = this.after(prefix);
        if (after !== null) {
            const before = after.before(suffix);
            if (before !== null) {
                return before;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    },


    replaceAll: function (target, replacement) {
        return this.split(target).join(replacement);
    },

})
