/**
 * @module library.node.storage.base.categories.primitives
 * @class Set_store
 * @extends Set
 * @classdesc Extension of Set class with methods for loading from and recording to a store.
 */
"use strict";

(class Set_store extends Set {

    /**
     * @description Loads the set from a record using a store.
     * @param {Object} aRecord - The record to load from.
     * @param {Object} aStore - The store to use for unreferencing values.
     * @returns {Set_store} The loaded set.
     * @category Data Loading
     */
    loadFromRecord (aRecord, aStore) {
        const values = aRecord.values.map(v => aStore.unrefValue(v));
        values.forEach(v => this.add(v));
        return this;
    }

    /**
     * @description Creates a record representation of the set for storing.
     * @param {Object} aStore - The store to use for referencing values.
     * @returns {Object} The record representation of the set.
     * @category Data Storing
     */
    recordForStore (aStore) { // should only be called by Store
        return {
            type: Type.typeName(this),
            values: this.valuesArray().map(v => aStore.refValue(v))
        };
    }

    /**
     * @description Determines if the set should be stored.
     * @returns {boolean} Always returns true.
     * @category Data Management
     */
    shouldStore () {
        return true;
    }

    /**
     * @description Collects persistent unique identifiers (PIDs) for JSON store.
     * @param {Set} puuids - Set to collect PIDs.
     * @returns {Set} The set of collected PIDs.
     * @category Data Management
     */
    refsPidsForJsonStore (puuids = new Set()) {
        this.forEach(v => {
            if (!Type.isNull(v)) {
                v.refsPidsForJsonStore(puuids);
            }
        });
        return puuids;
    }

}).initThisCategory();
