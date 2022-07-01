"use strict";


(class Array_store extends Array {

    
    static instanceFromRecordInStore (aRecord, aStore) { 
        // should only be called by Store
        let typeName = aRecord.type
        if (typeName !== "SubnodesArray") {
            typeName = "SubnodesArray" // TODO: have setSubnodes do a type conversion? 
        }
        const aClass = Object.getClassNamed(typeName)
        const obj = aClass.clone()
        //const obj = this.thisClass().clone()
        //obj.loadFromRecord(aRecord, aStore) 
        return obj
    }

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
        loadedValues.forEach( v => this.unhooked_push(v) )
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
