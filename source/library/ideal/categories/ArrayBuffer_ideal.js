"use strict";

/**
 * @module ideal
 * @class ArrayBuffer_ideal
 * @extends ArrayBuffer
 * Extends the JavaScript ArrayBuffer primitive with additional methods.
 */
(class ArrayBuffer_ideal extends ArrayBuffer {

    /**
     * Converts the ArrayBuffer to a string using UTF-8 encoding.
     * @returns {string} The decoded string representation of the ArrayBuffer.
     * @throws {Error} If the bytes in the ArrayBuffer are not valid UTF-8.
     */
    asString () {
        // have to be careful with this.  If the bytes are not valid utf-8, this will throw an error.
        return new TextDecoder().decode(this);
    }

}).initThisCategory();

