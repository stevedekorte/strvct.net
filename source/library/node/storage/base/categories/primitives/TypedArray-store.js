"use strict";

/*
Type.typedArrayTypeNames().forEach((name) => {
    const aClass = Object.getClassNamed(name)

    if (Type.isUndefined(aClass)) {
        console.warn("TypeArray-store error: missing type " + name)
        return
    }

    Object.defineSlots(aClass, {
        instanceFromRecordInStore: function(aRecord, aStore) { // should only be called by Store
            const obj = new this.thisClass()(aRecord.length)
            //obj.loadFromRecord(aRecord, aStore)
            return obj
        },
    })

    Object.defineSlots(aClass.prototype, {

        loadFromRecord: function(aRecord, aStore) {
            const values = aRecord.values
            for (let i = 0; i < values.length; i++) {
                this[i] = values[i]
            }
            return this
        },

        valuesArray: function() {
            return Array.fromIterator(this.values())
        },

        recordForStore: function(aStore) { // should only be called by Store
            return {
                type: this.type(), 
                values: this.valuesArray() 
            }
        },

        refsPidsForJsonStore: function(puuids = new Set()) {
            // no references in a TypedArray
            return puuids
        },
    })

})
*/

const aClass = Int8Array.__proto__ // just using int array to get to abstract parent TypeArray class, as we can't use TypeArray name directly

Object.defineSlots(aClass, {
    instanceFromRecordInStore: function(aRecord, aStore) { // should only be called by Store
        const obj = new this.thisClass()(aRecord.length)
        //obj.loadFromRecord(aRecord, aStore)
        return obj
    },
})

Object.defineSlots(aClass.prototype, {

    loadFromRecord: function(aRecord, aStore) {
        const values = aRecord.values
        for (let i = 0; i < values.length; i++) {
            this[i] = values[i]
        }
        return this
    },

    valuesArray: function() {
        return Array.fromIterator(this.values())
    },

    recordForStore: function(aStore) { // should only be called by Store
        return {
            type: this.type(), 
            values: this.valuesArray() 
        }
    },

    refsPidsForJsonStore: function(puuids = new Set()) {
        // no references in a TypedArray
        return puuids
    },
})
