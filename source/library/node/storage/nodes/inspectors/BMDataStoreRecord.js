"use strict";

/*
    
    BMDataStoreRecord
    
    A visible representation of a storage record.
    
*/

(class BMDataStoreRecord extends BMFieldSetNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("key", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("store", null);
            slot.setSlotType("Object"); // TODO: add store protocol
        }
    }

    initPrototype () {
        this.setCanDelete(false); // too dangerous
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        const jsonField = BMTextAreaField.clone().setKey("recordString")
        jsonField.setValueMethod("recordString").setValueIsEditable(false).setIsMono(true)
        this.addField(jsonField)

        this.referencedRecords().forEach((aRecord) => {
            const node = BMDataStoreRecord.forRecord(aRecord)
            this.addSubnode(node)
        })
    }

    record () {
        return this.store().recordForPid(this.key())
    }

    setRecordString (s) {
        throw new Error("not editable")
    }

    recordString () {
        return JSON.stableStringify(this.record(), null, 2)
    }

    referencedRecords () {
        return this.referencedPidSet().map( pid => this.defaultStore().recordForPid(pid) )
    }

    referencedPidSet () {
        return this.defaultStore().refSetForPuuid(this.record().id)
    }

    /*
    delete () {
        super.delete()
        this.defaultStore().justRemovePid(this.key())
        return this
    }
    */

    static forRecord (aRecord) {
        const subnode = BMDataStoreRecord.clone()
        subnode.setTitle(aRecord.type + " " + aRecord.id)
        //subnode.setTitle(aRecord.id)
        subnode.setKey(aRecord.id)
        subnode.setStore(this.defaultStore()) //// <-------------------- avoid this?
        const size = JSON.stableStringify(aRecord).length
        subnode.setSubtitle(size.byteSizeDescription())
        return subnode
    }
    
}.initThisClass());

