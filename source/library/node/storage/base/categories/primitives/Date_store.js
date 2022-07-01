"use strict";


(class Date_store extends Date {

    static instanceFromRecordInStore (aRecord, aStore) { // should only be called by Store
        const obj = this.clone()
        //obj.loadFromRecord(aRecord, aStore)
        return obj
    }

    loadFromRecord (aRecord, aStore) {
        this.setTime(aRecord.time)
        return this
    }

    recordForStore (aStore) { // should only be called by Store
        return {
            type: this.type(), 
            time: this.getTime() // toJSON is a standard library Date method
        }
    }

    shouldStore () {
        return true
    }

    refsPidsForJsonStore (puuids = new Set()) {
        return puuids
    }

}).initThisCategory();
