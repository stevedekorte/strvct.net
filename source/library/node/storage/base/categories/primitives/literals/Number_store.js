/**
 * @module library.node.storage.base.categories.primitives.literals
 * @class Number_store
 * @extends Number
 * @classdesc A class extending the Number primitive type with additional storage-related functionality.
 */
"use strict";

(class Number_store extends Number {

    /**
     * Retrieves reference PIDs for JSON store.
     * @param {Set} puuids - A Set of PUUIDs.
     * @returns {Set} The input Set of PUUIDs.
     */
    refsPidsForJsonStore (puuids = new Set()) {
        return puuids
    }

}).initThisCategory();