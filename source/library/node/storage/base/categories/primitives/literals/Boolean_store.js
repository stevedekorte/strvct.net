/**
 * @module library.node.storage.base.categories.primitives.literals
 * @class Boolean_store
 * @extends Boolean
 * @classdesc Extension of the Boolean class for storage purposes.
 */
"use strict";

(class Boolean_store extends Boolean {

    /**
     * @description Returns the set of persistent unique identifiers (puuids) for JSON store references.
     * @param {Set} puuids - Set of persistent unique identifiers.
     * @returns {Set} The input set of puuids.
     * @category Storage
     */
    refsPidsForJsonStore(puuids = new Set()) {
        return puuids
    }

}).initThisCategory();