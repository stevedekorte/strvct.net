"use strict";

/*

    Map_ideal

    Some extra methods for the Javascript Set primitive.

*/

(class Map_ideal extends Map {
    /*
    shallowCopy () {
        return new Map(this)
    }
    */

    isEqual (aMap) {
        if (this.size !== aMap.size) {
            return false
        }

        for (let k in this) {
            const v1 = this.get(k)
            const v2 = aMap.get(k)
            if (v1 !== v2) {
                return false
            }
        }
        
        return true
    }

    isEmpty (func) {
        return this.size == 0        
    }

}).initThisCategory();

    