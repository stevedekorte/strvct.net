/**
 * @module library.node.storage.nodes.inspectors
 * @class BMDataStore
 * @extends BaseNode
 * @classdesc A visible representation of the storage system
 */
(class BMDataStore extends BaseNode {
    
    /**
     * @static
     * @description Initializes the class
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true)
    }

    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} lastSyncTime
         * @category Data
         */
        {
            const slot = this.newSlot("lastSyncTime", 0);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the instance
     * @category Initialization
     */
    init () {
        super.init()
        this.setTitle("Storage")
    }

    /**
     * @description Returns the subtitle for the data store
     * @returns {string}
     * @category Display
     */
    subtitle () {
        return this.defaultStore().totalBytes().byteSizeDescription()
    }

    /**
     * @description Checks if the store has changed
     * @returns {boolean}
     * @category State Management
     */
    storeHasChanged () {
        return this.defaultStore().lastSyncTime() !== this.lastSyncTime()
    }

    /**
     * @description Prepares to sync to view
     * @category Synchronization
     */
    prepareToSyncToView () {
        if (this.subnodeCount() === 0 || this.storeHasChanged()) {
            this.defaultStore().collect()
            this.setLastSyncTime(this.defaultStore().lastSyncTime())
            this.refreshSubnodes()
        }
    }

    /**
     * @description Returns the default store
     * @returns {Object}
     * @category Data Access
     */
    store () {
        return this.defaultStore()
    }

    /**
     * @description Refreshes the subnodes
     * @category Data Management
     */
    refreshSubnodes () {
        this.removeAllSubnodes()
        this.store().allPids().forEach((pid) => {
            const aRecord = this.store().recordForPid(pid)
            this.addRecord(aRecord)
        })
    }

    /**
     * @description Returns or creates a subnode for a given class name
     * @param {string} aClassName
     * @returns {Object}
     * @category Node Management
     */
    subnodeForClassName (aClassName) {
        let subnode = this.firstSubnodeWithTitle(aClassName)
        if (!subnode) {
            subnode = BaseNode.clone().setTitle(aClassName).setNoteIsSubnodeCount(true)
            this.justAddSubnode(subnode)
        }
        return subnode
    }

    /**
     * @description Adds a record to the data store
     * @param {Object} aRecord
     * @returns {BMDataStore}
     * @category Data Management
     */
    addRecord (aRecord) {
        const subnode = BMDataStoreRecord.clone()
        subnode.setTitle(aRecord.id)
        subnode.setKey(aRecord.id)
        subnode.setStore(this.store())
        const size = JSON.stableStringifyWithStdOptions(aRecord).length
        subnode.setSubtitle(size.byteSizeDescription())

        const classNode = this.subnodeForClassName(aRecord.type)
        classNode.justAddSubnode(subnode)

        return this
    }
    
}.initThisClass());