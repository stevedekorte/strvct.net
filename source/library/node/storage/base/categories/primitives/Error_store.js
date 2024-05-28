"use strict";


(class Error_store extends Error {

    loadFromRecord (aRecord, aStore) {
        this.name = aRecord.name;
        this.message = aRecord.message;
        return this
    }

    recordForStore (aStore) { // should only be called by Store
        return {
            type: this.type(), 
            name: this.name,
            message: this.message
        }
    }

    shouldStore () {
        return true
    }

    refsPidsForJsonStore (puuids = new Set()) {
        return puuids
    }

}).initThisCategory();
