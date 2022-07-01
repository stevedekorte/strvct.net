"use strict";


(class Map_store extends Map {

    static instanceFromRecordInStore (aRecord, aStore) { // should only be called by Store
        const obj = this.clone()
        //obj.loadFromRecord(aRecord, aStore)
        return obj
    }

    loadFromRecord (aRecord, aStore) {
        aRecord.entries.forEach((entry) => {
            const key = entry[0]
            const value = aStore.unrefValue(entry[1])
            this.atPut(key, value)
        })

        return this
    }

    recordForStore (aStore) { // should only be called by Store
        let iterator = this.entries();
        let entry = iterator.next().value
        const entries = []
        while (entry) {
            const key = entry[0]
            const value = entry[1]
            entries.push([key, aStore.refValue(value)])
            entry = iterator.next().value
        }

        return {
            type: this.type(), 
            entries: entries
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



