"use strict";

/*

    ArrayBuffer_ideal

    Some extra methods for the Javascript ArrayBuffer primitive.

*/

(class ArrayBuffer_ideal extends ArrayBuffer {

    asString () {
        // have to be careful with this.  If the bytes are not valid utf-8, this will throw an error.
        return new TextDecoder().decode(this);
    }

}).initThisCategory();

