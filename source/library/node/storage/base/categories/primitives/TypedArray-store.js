"use strict";

/**
 * @module library.node.storage.base.categories.primitives
 */

/**
 * @class TypedArray
 * @classdesc Extends TypedArray functionality for storage operations.
 *
 * Note: The following code was commented out in the original file:
 * Type.typedArrayTypeNames().forEach((name) => {
 *     const aClass = Object.getClassNamed(name)
 *
 *     if (Type.isUndefined(aClass)) {
 *         console.warn("TypeArray-store error: missing type " + name)
 *         return
 *     }
 *
 *     Object.defineSlots(aClass, {
 *         instanceFromRecordInStore: function(aRecord, aStore) { // should only be called by Store
 *             const obj = new this.thisClass()(aRecord.length)
 *             //obj.loadFromRecord(aRecord, aStore)
 *             return obj
 *         },
 *     })
 *
 *     Object.defineSlots(aClass.prototype, {
 *
 *         loadFromRecord: function(aRecord, aStore) {
 *             const values = aRecord.values
 *             for (let i = 0; i < values.length; i++) {
 *                 this[i] = values[i]
 *             }
 *             return this
 *         },
 *
 *         valuesArray: function() {
 *             return Array.fromIterator(this.values())
 *         },
 *
 *         recordForStore: function(aStore) { // should only be called by Store
 *             return {
 *                 type: this.svType(),
 *                 values: this.valuesArray()
 *             }
 *         },
 *
 *         refsPidsForJsonStore: function(puuids = new Set()) {
 *             // no references in a TypedArray
 *             return puuids
 *         },
 *     })
 *
 * })
 */

const typedArrayClass = Int8Array.__proto__; // just using int array to get to abstract parent TypeArray class, as we can't use TypeArray name directly

Object.defineSlots(typedArrayClass, {
    /**
     * @static
     * @category Initialization
     * @description Creates an instance of the TypedArray from a record in the store.
     * @param {Object} aRecord - The record to create the instance from.
     * @param {Object} aStore - The store containing the record.
     * @returns {TypedArray} The created TypedArray instance.
     */
    instanceFromRecordInStore: function (aRecord, aStore) { // should only be called by Store
        const obj = new this.thisClass()(aRecord.length);
        return obj;
    },
});

Object.defineSlots(typedArrayClass.prototype, {

    /**
     * @category Data Loading
     * @description Loads the TypedArray from a record.
     * @param {Object} aRecord - The record to load from.
     * @param {Object} aStore - The store containing the record.
     * @returns {TypedArray} The loaded TypedArray.
     */
    loadFromRecord: function (aRecord, aStore) {
        const values = aRecord.values;
        for (let i = 0; i < values.length; i++) {
            this[i] = values[i];
        }
        return this;
    },

    /**
     * @category Data Conversion
     * @description Converts the TypedArray to a regular Array.
     * @returns {Array} The TypedArray as a regular Array.
     */
    valuesArray: function () {
        return Array.fromIterator(this.values());
    },

    /**
     * @category Data Storage
     * @description Creates a record representation of the TypedArray for storage.
     * @param {Object} aStore - The store to create the record for.
     * @returns {Object} The record representation of the TypedArray.
     */
    recordForStore: function (aStore) { // should only be called by Store
        return {
            type: this.svType(),
            values: this.valuesArray()
        };
    },

    /**
     * @category Reference Management
     * @description Returns the set of persistent unique identifiers for references in the TypedArray.
     * @param {Set} puuids - The set of persistent unique identifiers.
     * @returns {Set} The set of persistent unique identifiers (unchanged as TypedArrays have no references).
     */
    refsPidsForJsonStore: function (puuids = new Set()) {
        // no references in a TypedArray
        return puuids;
    },
});
