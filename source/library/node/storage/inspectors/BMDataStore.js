"use strict";

/*

    BMDataStore

    A visible representation of the storage system
    
*/

(class BMDataStore extends BaseNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
        return this
    }

    initPrototype () {
        this.newSlot("lastSyncTime", 0)
    }

    init () {
        super.init()
        this.setTitle("Storage")
        this.setNodeMinWidth(300)
    }

    subtitle () {
        return this.defaultStore().totalBytes().byteSizeDescription()
    }

    storeHasChanged () {
        return this.defaultStore().lastSyncTime() !== this.lastSyncTime()
    }

    prepareToSyncToView () {
        //console.log("this.storeHasChanged() = ", this.storeHasChanged())

        if (this.subnodeCount() === 0 || this.storeHasChanged()) {
            this.defaultStore().collect()
            this.setLastSyncTime(this.defaultStore().lastSyncTime())
            this.refreshSubnodes()
        }
    }

    store () {
        return this.defaultStore()
    }

    refreshSubnodes () {
        //this.debugLog(" refreshSubnodes")
        this.removeAllSubnodes()
        this.store().allPids().forEach((pid) => {
            const aRecord = this.store().recordForPid(pid)
            this.addRecord(aRecord)
        })
    }

    subnodeForClassName (aClassName) {
        let subnode = this.firstSubnodeWithTitle(aClassName)
        if (!subnode) {
            subnode = BaseNode.clone().setTitle(aClassName).setNoteIsSubnodeCount(true)
            this.justAddSubnode(subnode)
        }
        return subnode
    }

    addRecord (aRecord) {
        const subnode = BMDataStoreRecord.clone()
        //subnode.setTitle(aRecord.type + " " + aRecord.id)
        subnode.setTitle(aRecord.id)
        subnode.setKey(aRecord.id)
        subnode.setStore(this.store())
        const size = JSON.stringify(aRecord).length
        subnode.setSubtitle(size.byteSizeDescription())

        const classNode = this.subnodeForClassName(aRecord.type)
        classNode.setNodeMinWidth(300)
        classNode.justAddSubnode(subnode)

        return this
    }
    
}.initThisClass());
