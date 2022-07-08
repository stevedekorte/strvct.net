"use strict";


(class ArrayBuffer_store extends ArrayBuffer {

    static instanceFromRecordInStore (aRecord, aStore) { // should only be called by Store
        //assert(aRecord.type === "ArrayBuffer")
        const bytes = aRecord.bytes
        const obj = new ArrayBuffer(bytes.length)
        return obj
    }

    loadFromRecord (aRecord, aStore) {
        assert(aRecord.bytes.length === this.length)
        const bytes = aRecord.bytes
        for (let i = 0; i < bytes.length; i++) {
            this[i] = bytes[i]
        }
        return this
    }

    bytes () {
        const bytes = []
        for (let i = 0; i < this.byteLength; i++) {
            bytes.push(this[i])
        }
        return bytes
    }

    recordForStore (aStore) { // should only be called by Store
        return {
            type: "ArrayBuffer", //Type.typeName(this), 
            bytes: this.bytes(),
        }
    }

    refsPidsForJsonStore (puuids = new Set()) {
        return puuids
    }
    
}).initThisCategory();



