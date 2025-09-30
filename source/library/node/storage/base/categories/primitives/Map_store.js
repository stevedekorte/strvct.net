/**
 * @module library.node.storage.base.categories.primitives
 * @class Map_store
 * @extends Map
 * @classdesc A custom Map class with additional methods for loading from and converting to records for storage purposes.
 */
"use strict";

(class Map_store extends Map {

    /**
     * @description Loads the map from a record.
     * @param {Object} aRecord - The record to load from.
     * @param {Object} aStore - The store object used for unreferencing values.
     * @returns {Map_store} The current instance.
     * @category Data Loading
     */
    loadFromRecord (aRecord, aStore) {
        aRecord.entries.forEach((entry) => {
            const key = entry[0];
            const value = aStore.unrefValue(entry[1]);
            this.atPut(key, value);
        });

        return this;
    }

    /**
     * @description Converts the map to a record for storage.
     * @param {Object} aStore - The store object used for referencing values.
     * @returns {Object} The record representation of the map.
     * @category Data Conversion
     */
    recordForStore (aStore) { // should only be called by Store
        let iterator = this.entries();
        let entry = iterator.next().value;
        const entries = [];
        while (entry) {
            const key = entry[0];
            const value = entry[1];
            entries.push([key, aStore.refValue(value)]);
            entry = iterator.next().value;
        }

        return {
            type: this.svType(),
            entries: entries
        };
    }

    /**
     * @description Determines if the map should be stored.
     * @returns {boolean} Always returns true.
     * @category Storage Management
     */
    shouldStore () {
        return true;
    }

    /**
     * @description Collects persistent unique identifiers (PUIDs) for JSON storage.
     * @param {Set} puuids - A set to collect the PUIDs.
     * @returns {Set} The set of collected PUIDs.
     * @category Data Collection
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
