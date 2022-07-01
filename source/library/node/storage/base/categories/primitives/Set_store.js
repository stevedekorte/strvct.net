"use strict";


(class Set_store extends Set {

    static instanceFromRecordInStore (aRecord, aStore) { // should only be called by Store
        assert(aRecord.type === "Set")
        const obj = this.clone()
        //obj.loadFromRecord(aRecord, aStore)
        return obj
    }

    loadFromRecord (aRecord, aStore) {
        const values = aRecord.values.map(v => aStore.unrefValue(v))
        values.forEach(v => this.add(v))
        return this
    }

    recordForStore (aStore) { // should only be called by Store
        return {
            type: Type.typeName(this), 
            values: this.valuesArray().map(v => aStore.refValue(v))
        }
    }

    shouldStore () {
        return true
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




