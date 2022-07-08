"use strict";


(class Array_store extends Array {

    static lengthOfRecord (aRecordObj) {
        return aRecordObj.values.length
    }

    recordForStore (aStore) { // should only be called by Store
        const dict = {
            type: Type.typeName(this), 
            values: this.map(v => aStore.refValue(v))
        }

        return dict
    }

    loadFromRecord (aRecord, aStore) {
        const loadedValues = aRecord.values.map(v => aStore.unrefValue(v))
        if (this.unhooked_push) {
            loadedValues.forEach( v => this.unhooked_push(v) )
        } else {
            loadedValues.forEach( v => this.push(v) )
        }
        return this
    }

    refsPidsForJsonStore (puuids = new Set()) {
        this.forEach(v => { 
            if (!Type.isNull(v)) { 
                v.refsPidsForJsonStore(puuids)
            } 
        })
        return puuids
    }

}).initThisCategory();
