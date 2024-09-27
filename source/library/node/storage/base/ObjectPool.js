"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class ObjectPool
 * @extends ProtoClass
 * @description

        For persisting a object tree to a JSON formatted representation and back.
        Usefull for both persistence and exporting object out the the app/browser and onto desktop or other browsers.

        This is a parent class for PersistentObjectPool, which just swaps out the recordDict AtomicMap, 
        with a PersistentAtomicMap.

        An object pool can also be created by pointing at an object within another pool.

        JSON format of pool:

            {
                rootPid: "rootPid",
                puuidToDict: {
                    "<objPid>" : <Record>
                }
            }

        Example use:
    
            // converting a node to json
            const poolJson = ObjectPool.clone().setRoot(rootNode).asJson()
            
            // converting json to a node
            const rootObject = ObjectPool.clone().fromJson(poolJson).root()

        Notes:

        Objects to be stored must implement:

            // writing methods
            puuid
            recordForStore (aStore)

            // reading methods
            static instanceFromRecordInStore (aRecord, aStore)
            loadFromRecord (aRecord, aStore)

        These are implemented on Object, and other primitives such as Array, Set, etc.

*/

(class ObjectPool extends ProtoClass {

    /**
     * @static
     * @description
     * @returns {boolean}
     */
    static shouldStore () {
        return false;
    }
    
    /**
     * @description initialize the prototype slots
     * @returns {void}
     */
    initPrototypeSlots () {
        /**
         * @member {String} name
         * @description the name of the object pool
         * @default "defaultDataStore"
         */
        {
            const slot = this.newSlot("name", "defaultDataStore");
            slot.setSlotType("String");
        }


        /**
         * @member {Object} rootObject
         * @description the root object of the object pool
         * @default null
         */

        {
            const slot = this.newSlot("rootObject", null);
            slot.setSlotType("Object");
        }

        /**
         * @member {AtomicMap} recordsMap
         * @description the map of records for the object pool
         * @default null
         */
        {
            const slot = this.newSlot("recordsMap", null);
            slot.setSlotType("AtomicMap");
        }

        /**
         * @member {Map} activeObjects
         * @description objects known to the pool (previously loaded or referenced)
         * @default null
         */
        {
            const slot = this.newSlot("activeObjects", null);
            slot.setDescription("objects known to the pool (previously loaded or referenced)");
            slot.setSlotType("Map");
        }

        /**
         * @member {Map} dirtyObjects
         * @description subset of activeObjects containing objects with mutations that need to be stored
         * @default null
         */
        {
            const slot = this.newSlot("dirtyObjects", null);
            slot.setDescription("subset of activeObjects containing objects with mutations that need to be stored");
            slot.setSlotType("Map");
        }

        /**
         * @member {Set} loadingPids
         * @description pids of objects that are currently being loaded
         * @default null
         */
        {
            const slot = this.newSlot("loadingPids", null);
            slot.setDescription("pids of objects that are currently being loaded");
            slot.setSlotType("Set");
        }

        /**
         * @member {Set} storingPids
         * @description pids of objects that are currently being stored
         * @default null
         */
        {
            const slot = this.newSlot("storingPids", null);
            slot.setDescription("pids of objects that are currently being stored");
            slot.setSlotType("Set");
        }

        /**
         * @member {Date} lastSyncTime
         * @description time of last sync. WARNING: vulnerable to system time changes/differences
         * @default null
         */
        {
            const slot = this.newSlot("lastSyncTime", null);
            slot.setDescription("Time of last sync. WARNING: vulnerable to system time changes/differences");
            slot.setSlotType("Date");
        }

        /**
         * @member {Set} markedSet
         * @description Set of puuids used during collection to mark objects that are reachable from the root
         * @default null
         */
        {
            const slot = this.newSlot("markedSet", null);
            slot.setDescription("Set of puuids used during collection to mark objects that are reachable from the root");
            slot.setSlotType("Set");
        }
        /*
        {
            const slot = this.newSlot("isReadOnly", false);
        }
        */

        /**
         * @member {BMNotification} nodeStoreDidOpenNote
         * @description Notification sent after pool opens
         * @default null
         */
        // TODO: change name to objectPoolDidOpen?
        {
            const slot = this.newSlot("nodeStoreDidOpenNote", null);
            slot.setDescription("Notification sent after pool opens");
            slot.setSlotType("BMNotification");
        }

        /**
         * @member {Boolean} isFinalizing
         * @description Set to true during method didInitLoadingPids() - used to ignore mutations during this period
         * @default false
         */
        {
            const slot = this.newSlot("isFinalizing", false);
            slot.setDescription("Set to true during method didInitLoadingPids() - used to ignore mutations during this period");
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Error|String} error
         * @description most recent error, if any
         * @default null
         */
        {
            const slot = this.newSlot("error", null); // most recent error, if any
            slot.setSlotType("Error");
        }

        /**
         * @member {Set} collectablePidSet
         * @description used during collection to store keys before tx begins
         * @default null
         */
        {
            const slot = this.newSlot("collectablePidSet", null); // used during collection to store keys before tx begins
            slot.setSlotType("Set");
        }
    }

    initPrototype () {
    }

    /**
     * @description initialize the object pool
     * @returns {void}
     */
    init () {
        super.init()
        this.setRecordsMap(ideal.AtomicMap.clone());
        this.setActiveObjects(new Map());
        this.setDirtyObjects(new Map());
        this.setLoadingPids(new Set());
        this.setLastSyncTime(null);
        this.setMarkedSet(null);
        this.setNodeStoreDidOpenNote(this.newNoteNamed("nodeStoreDidOpen"));
        this.setIsDebugging(false);
        return this
    }

    /**
     * @description set the debugging flag
     * @param {Boolean} b - the new debugging flag value
     * @returns {ObjectPool}
     */
    setIsDebugging (b) {
        if (b === false && this.isDebugging() === true) {
            debugger;
        }
        super.setIsDebugging(b)
        return this
    }

    /**
     * @description clear the cache
     * @returns {ObjectPool}
     */
    clearCache () {
        this.setActiveObjects(new Map())
        this.setDirtyObjects(new Map())
        this.readRoot()
        //this.setRootObject(this.objectForPid(this.rootObject().puuid()))
        return this
    }

    // --- open ---

    /*
    open () { // this class can also be used with synchronous AtomicMap
        this.recordsMap().setName(this.name());
        this.recordsMap().open();
        debugger;
        this.onPoolOpenSuccess();
        return this
    }
    */

    /**
     * @async
     * @description open the object pool
     * @returns {Promise}
     */
    async promiseOpen () { 
        //debugger;
        const map = this.recordsMap();
        map.setName(this.name());
        try {
            await map.promiseOpen();
            await this.onPoolOpenSuccess();
        } catch (error) {
            this.onPoolOpenFailure(error);
        }
    }

    /**
     * @async
     * @description called when the pool opens successfully
     * @returns {Promise}
     */
    async onPoolOpenSuccess () {
        //debugger
        // here so subclasses can easily hook
        await this.onRecordsDictOpen()
    }

    /**
     * @description called when the pool opens successfully
     * @param {Error} error - the error that occurred
     * @returns {void}
     */
    onPoolOpenFailure (error) {
        debugger
        // here so subclasses can easily hook
        throw error
    }

    /*
    postOpenNote () {
        this.postNoteNamed("objectPoolDidOpen")
    }
    */

    /**
     * @description show the records map
     * @param {String} s - optional comment
     * @returns {void}
     */
    show (s) {
        const comment = s ? " " + s + " " : ""
        console.log("---" + comment + "---")
        const max = 40
        console.log(this.recordsMap().count() + " records: ")
        this.recordsMap().forEachKV((k, v) => {
            if (v.length > max) {
                v = v.slice(0, max) + "..."
            }
            console.log("   '" + k + "': '" + v + "'")
        })

        console.log("------")
    }

    /**
     * @async
     * @description called when the records map opens successfully
     * @returns {Promise}
     */
    async onRecordsDictOpen () {
        //debugger
        //this.show("ON OPEN")
        await this.promiseCollect()
        //this.show("AFTER COLLECT")
        this.nodeStoreDidOpenNote().post()
        return this
    }

    /**
     * @description check if the object pool is open
     * @returns {Boolean}
     */
    isOpen () {
        return this.recordsMap().isOpen()
    }

    // --- root ---

    /**
     * @description get the root key
     * @returns {String}
     */
    rootKey () {
        return "root"
    }

    /**
     * @description set the root pid
     * @param {String} pid - the new root pid
     * @returns {ObjectPool}
     */
    setRootPid (pid) { 
        // private - it's assumed we aren't already in storing-dirty-objects tx
        const map = this.recordsMap()
        if (map.at(this.rootKey()) !== pid) {
            map.atPut(this.rootKey(), pid)
            console.log("---- SET ROOT PID " + pid + " ----")
            //debugger;
        }
        assert(this.hasStoredRoot())
        return this
    }

    /**
     * @description get the root pid
     * @returns {String}
     */
    rootPid () {
        return this.recordsMap().at(this.rootKey())
    }

    /**
     * @description check if the root has been stored
     * @returns {Boolean}
     */
    hasStoredRoot () {
        return this.recordsMap().hasKey(this.rootKey())
    }

    /**
     * @description get the root object or create it if it doesn't exist
     * @param {Function} aClosure - the closure to create the root object if it doesn't exist
     * @returns {Object}
     */
    rootOrIfAbsentFromClosure (aClosure) {
        //debugger;
        if (this.hasStoredRoot()) {
            this.readRoot()
        } else {
         //   debugger
            const newRoot = aClosure()
            assert(newRoot)
            this.setRootObject(newRoot)
        }
        return this.rootObject()
    }

    /**
     * @description read the root object
     * @returns {Object}
     */
    readRoot () {
        //console.log(" this.hasStoredRoot() = " + this.hasStoredRoot())
        if (this.hasStoredRoot()) {
            const root = this.objectForPid(this.rootPid()) // this call will actually internally set this._rootObject as we may need it while loading the root's refs
            assert(!Type.isNullOrUndefined(root))
            //this._rootObject = root
            //this.setRootObject(root) // this is for setting up new root
            return this.rootObject()
        }
        throw new Error("missing root object")
    }

    /**
     * @description check if the object pool knows about the object
     * @param {Object} obj - the object to check
     * @returns {Boolean}
     */
    knowsObject (obj) { // private
        const puuid = obj.puuid()
        const foundIt = this.recordsMap().hasKey(puuid) ||
            this.activeObjects().has(puuid) ||
            this.dirtyObjects().has(puuid) // dirty objects check redundant with activeObjects?
        return foundIt
    }

    /**
     * @description assert that the object pool is open
     * @returns {void}
     */
    assertOpen () {
        assert(this.isOpen())
    }

    /*
    changeOldPidToNewPid (oldPid, newPid) {
        // flush and change pids on all activeObjects 
        // and pids and pidRefs in recordsMap 
        throw new Error("unimplemented")
        return this
    }
    */
    
    /**
     * @description set the root object
     * @param {Object} obj - the new root object
     * @returns {ObjectPool}
     */
    setRootObject (obj) { // only used for setting up a new root object
        this.assertOpen()
        if (this._rootObject) {
            // can support this if we change all stored and
            //this.changeOldPidToNewPid("root", Object.newUuid())
            throw new Error("can't change root object yet, unimplemented")
        }

        assert(!this.knowsObject(obj))

        //debugger;
        //this.setRootPid(obj.puuid()) // this is set when the dirty root object is stored
        this._rootObject = obj
        this.debugLog(" adding rootObject " + obj.debugTypeId())
        this.addActiveObject(obj)
        this.addDirtyObject(obj)
        return this
    }

    // ---  ---

    /**
     * @description convert the records map to a JSON string
     * @returns {String}
     */
    asJson () {
        return this.recordsMap().asJson()
    }

    /**
     * @description update the last sync time
     * @returns {ObjectPool}
     */
    updateLastSyncTime () {
        this.setLastSyncTime(Date.now())
        return this
    }

    // --- active and dirty objects ---

    /**
     * @description check if the object pool has the active object
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    hasActiveObject (anObject) {
        const puuid = anObject.puuid()
        return this.activeObjects().has(puuid)
    }
    
    /**
     * @description add an active object
     * @param {Object} anObject - the object to add
     * @returns {Boolean}
     */
    addActiveObject (anObject) {
        assert(!anObject.isClass());

        /*
        if (anObject.type() === "Error") {
            debugger;
            return false;
        }
        */

        if (anObject.type() === "PersistentObjectPool") {
            console.log("addActiveObject() called with PersistentObjectPool");
            debugger;
            return false;
        }

        if (!anObject.shouldStore()) {
            const msg = "attempt to addActiveObject '" + anObject.type() + "' but shouldStore is false"
            console.warn(msg)
            anObject.shouldStore()
            //throw new Error(msg)
            return false
        }

        if (!anObject.isInstance()) {
            const msg = "can't store non instance of type '" + anObject.type() + "'"
            console.log(msg)
            anObject.isKindOf(ProtoClass) 
            throw new Error(msg)
        }

        //debugger;

        if (!this.hasActiveObject(anObject)) {
            //const title = anObject.title ? anObject.title() : "-";
            //this.debugLog(() => anObject.debugTypeId() + ".addMutationObserver(" + this.debugTypeId() + " '" + title + "')")
            anObject.addMutationObserver(this)
            this.activeObjects().set(anObject.puuid(), anObject)
            //this.addDirtyObject(anObject)
        }

        return true
    }

    /**
     * @description close the object pool
     * @returns {ObjectPool}
     */
    close () {
        this.removeMutationObservations()
        this.setActiveObjects(new Map())
        this.setDirtyObjects(new Map())
        this.recordsMap().close()
        return this
    }

    /**
     * @description remove mutation observations
     * @returns {ObjectPool}
     */
    removeMutationObservations () {
        this.activeObjects().forEachKV((puuid, obj) => obj.removeMutationObserver(this)) // activeObjects is super set of dirtyObjects
        return this
    }

    /**
     * @description check if the object pool has dirty objects
     * @returns {Boolean}
     */
    hasDirtyObjects () {
        return !this.dirtyObjects().isEmpty()
    }

    /*
    hasDirtyObject (anObject) {
        const puuid = anObject.puuid()
        return this.dirtyObjects().has(puuid)
    }
    */

    /**
     * @description handle the object update pid event
     * @param {Object} anObject - the object that was updated
     * @param {String} oldPid - the old pid
     * @param {String} newPid - the new pid
     * @returns {void}
     */
    onObjectUpdatePid (anObject, oldPid, newPid) {
        // sanity check for debugging - could remove later
        if (this.hasActiveObject(anObject)) {
            const msg = "onObjectUpdatePid " + anObject.typeId() + " " + oldPid + " -> " + newPid
            console.log(msg)
            throw new Error(msg)
        }
    }

    /**
     * @description handle the object did mutate event
     * @param {Object} anObject - the object that was mutated
     * @returns {void}
     */
    onDidMutateObject (anObject) {
        //if (anObject.hasDoneInit() && ) {
        if (this.hasActiveObject(anObject) && !this.isLoadingObject(anObject)) {
            this.addDirtyObject(anObject)
        }
    }

    /**
     * @description check if the object is being stored
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    isStoringObject (anObject) {
        const puuid = anObject.puuid()
        if (this.storingPids()) {
            if (this.storingPids().has(puuid)) {
                return true
            }
        }
        return false
    }

    /**
     * @description check if the object is being loaded
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    isLoadingObject (anObject) { // private
        if (this.loadingPids()) {
            if (this.loadingPids().has(anObject.puuid())) {
                return true
            }
        }
        return false
    }

    /**
     * @description add a dirty object
     * @param {Object} anObject - the object to add
     * @returns {ObjectPool}
     */
    addDirtyObject (anObject) { // private
        if (!this.hasActiveObject(anObject)) {
            console.log("looks like it hasn't been referenced yet")
            throw new Error("not referenced yet")
        }

        const puuid = anObject.puuid()

        if (this.isStoringObject(anObject)) {
            return this
        }

        if (this.isLoadingObject(anObject)) {
            return this
        }

        if (!this.dirtyObjects().has(puuid)) {
            this.debugLog(() => "addDirtyObject(" + anObject.typeId() + ")" )
            if (this.storingPids() && this.storingPids().has(puuid)) {
                throw new Error("attempt to double store? did object change after store? is there a loop?")
            }
            this.dirtyObjects().set(puuid, anObject)
            this.scheduleStore()
        }

        return this
    }

    /**
     * @description schedule the store of dirty objects
     * @returns {ObjectPool}
     */
    scheduleStore () {
        if (!this.isOpen()) {
            console.log(this.typeId() + " can't schedule store yet, not open")
            return this
        }
        assert(this.isOpen())
        const scheduler = SyncScheduler.shared();
        const methodName = "commitStoreDirtyObjects";
        //console.log(this.type() + " --- scheduleStore ---")
        if (!scheduler.isSyncingTargetAndMethod(this, methodName)) {
            if (!scheduler.hasScheduledTargetAndMethod(this, methodName)) {
                //console.warn("scheduleStore currentAction = ", SyncScheduler.currentAction() ? SyncScheduler.currentAction().description() : null);
                this.debugLog("scheduling commitStoreDirtyObjects dirty object count:" + this.dirtyObjects().size );
                scheduler.scheduleTargetAndMethod(this, methodName, 1000);
            }
        }
        return this
    }

    // --- storing ---

    /**
     * @asynca
     * @description commit the store of dirty objects
     * @returns {void}
     */
    async commitStoreDirtyObjects () {
        this.debugLog("commitStoreDirtyObjects dirty object count:" + this.dirtyObjects().size);

        if (this.hasDirtyObjects()) {
            //console.log(this.type() + " --- commitStoreDirtyObjects ---")

            //this.debugLog("--- commitStoreDirtyObjects begin ---")
            await this.recordsMap().promiseBegin()
            const storeCount = this.storeDirtyObjects()
            await this.recordsMap().promiseCommit()
            this.debugLog("--- commitStoreDirtyObjects end --- stored " + storeCount + " objects")
            this.debugLog("--- commitStoreDirtyObjects total objects: " + this.recordsMap().count())


            //this.show("AFTER commitStoreDirtyObjects")
        }
    }

    /**
     * @description store the dirty objects
     * @returns {Number}
     */
    storeDirtyObjects () { // PRIVATE
        // store the dirty objects, if they contain references objects unknown to pool,
        // they'll be added as active + dirty objects which will be stored on next loop. 
        // We continue until there are no dirty objects left.

        let totalStoreCount = 0
        this.setStoringPids(new Set())

        while (true) { // easier to express clearly than do/while in this case
            let thisLoopStoreCount = 0
            const dirtyBucket = this.dirtyObjects();
            this.setDirtyObjects(new Map());

            dirtyBucket.forEachKV((puuid, obj) => {
                //console.log("  storing pid " + puuid)

                if (this.storingPids().has(puuid)) {
                    const msg = "ERROR: attempt to double store " + obj.typeId()
                    console.log(msg)
                    throw new Error(msg)
                }

                this.storingPids().add(puuid)
                //debugger;
                this.storeObject(obj)

                thisLoopStoreCount ++
            })

            if (thisLoopStoreCount === 0) {
                break
            }

            totalStoreCount += thisLoopStoreCount
            //this.debugLog(() => "totalStoreCount: " + totalStoreCount)
        }

        this.setStoringPids(null)
        return totalStoreCount
    }

    // --- reading ---

    /**
     * @description get the className conversion map
     * @returns {Map}
     */
    classNameConversionMap () {
        const m = new Map()
        /*
        m.set("BMMenuNode", "BMFolderNode")
        */
       return m;
    }

    /**
     * @description get the class for the given name
     * @param {String} className - the name of the class
     * @returns {Class}
     */
    classForName (className) { 
        const m = this.classNameConversionMap()
        if (m.has(className)) {
            return Object.getClassNamed(m.get(className))
        } 

        return Object.getClassNamed(className)
    }

    /**
     * @description get the object for the given record
     * @param {Object} aRecord - the record to get the object for
     * @returns {Object}
     */
    objectForRecord (aRecord) { // private
        const className = aRecord.type
        //console.log("loading " + className + " " + aRecord.id)
        if (className === "Promise") {
            console.warn(this.type() + " WARNING: a Promise was stored. Returning a null. Check stack trace to see which object stored it.")
            debugger
            return null
        }

        const aClass = this.classForName(className)

        if (!aClass) {
            const error = "missing class '" + className + "'"
            console.warn(error)
            //throw new Error(error)
            debugger
            return null
        }
        assert(!Type.isNullOrUndefined(aRecord.id))

        if (Type.isUndefined(aClass.instanceFromRecordInStore)) {
            console.warn("Class '" + className + "' missing method 'instanceFromRecordInStore' - deserializing as null");
            debugger;
            return null;
        }
        const obj = aClass.instanceFromRecordInStore(aRecord, this);
        if (obj === null) {
            // maybe the class shouldStore is false?
            return null;
        }

        assert(!this.hasActiveObject(obj))
        obj.setPuuid(aRecord.id)
        this.addActiveObject(obj)
        if (obj.puuid() === this.rootPid()) {
            this._rootObject = obj; // bit of a hack to make sure root ref is set before we load root contents
            // might want to split this method into one to get ref and another to load contents instead
        }
        obj.loadFromRecord(aRecord, this)

        this.loadingPids().delete(obj.puuid()) // need to do this to get object to ber marked as dirty if it's slots are updated in finalInit

        if (obj.finalInit) {
            obj.finalInit();
        }
        
        if (obj.afterInit) {
            obj.afterInit();
        }
        return obj
    }

    /**
     * @description get the active object for the given pid
     * @param {String} puuid - the pid to get the active object for
     * @returns {Object}
     */
    activeObjectForPid (puuid) {
        return this.activeObjects().get(puuid);
    }

    /**
     * @description get the object for the given pid
     * @param {String} puuid - the pid to get the object for
     * @returns {Object}
     */
    objectForPid (puuid) { // PRIVATE (except also used by StoreRef)
        //console.log("objectForPid " + puuid)

        // return active object for pid, if there is one
        const activeObj = this.activeObjectForPid(puuid);
        if (activeObj) {
            return activeObj;
        }

        // schedule didInitLoadingPids to occur at end of event loop 

        if (!this.isFinalizing() && this.loadingPids().count() === 0) {
            SyncScheduler.shared().scheduleTargetAndMethod(this, "didInitLoadingPids");
        }

        this.loadingPids().add(puuid);
        /*
        if (puuid === "ISkYj2Vrxc") {
            debugger;
        }
        */
        
        const aRecord = this.recordForPid(puuid);
        if (Type.isUndefined(aRecord)) {
            console.log("missing record for " + puuid);
            return undefined;
        }
        if (aRecord.type === "PersistentObjectPool") {
            console.log("skipping PersistentObjectPool record for " + puuid);
            return null;
        }
        const loadedObj = this.objectForRecord(aRecord);
        return loadedObj;
    }

    /**
     * @description initialize the loading pids
     * @returns {void}
     */
    didInitLoadingPids () {
        assert(!this.isFinalizing()); // sanity check
        this.setIsFinalizing(true);
        while (!this.loadingPids().isEmpty()) { // while there are still loading pids
            const lastSet = this.loadingPids();
            this.setLoadingPids(new Set());

            lastSet.forEach(loadedPid => { // sends didLoadFromStore to each matching object
                const obj = this.activeObjectForPid(loadedPid);
                if (Type.isUndefined(obj)) {
                    const errorMsg = "missing activeObjectForPid " + loadedPid;
                    console.warn(errorMsg);
                    //throw new Error(errorMsg)
                } else if (obj.didLoadFromStore) {
                    obj.didLoadFromStore(); // should this be able to trigger an objectForPid() that would add to loadingPids?
                }
            })
        }
        this.setIsFinalizing(false);
    }

    //

    /**
     * @description get the header key
     * @returns {String}
     */
    headerKey () {
        return "header"; // no other key looks like this as they all use PUUID format
    }

    /**
     * @description get the all pids set
     * @returns {Set}
     */
    allPidsSet () {
        const keySet = this.recordsMap().keysSet();
        keySet.delete(this.headerKey());
        return keySet;
    }

    /**
     * @description get the all pids
     * @returns {Array}
     */
    allPids () {
        const keys = this.recordsMap().keysArray();
        keys.remove(this.rootKey());
        return keys;
    }

    /**
     * @description get the active lazy pids
     * @returns {Set}
     */
    activeLazyPids () { // returns a set of pids
        const pids = new Set();
        this.activeObjects().forEachKV((pid, obj) => {
            if (obj.lazyPids) {
                obj.lazyPids(pids);
            }
        })
        return pids;
    }

    // --- references ---

    /**
     * @description get the ref for the given pid
     * @param {String} aPid - the pid to get the ref for
     * @returns {Object}
     */
    refForPid (aPid) {
        return { "*": this.pid() };
    }

    /**
     * @description get the pid for the given ref
     * @param {Object} aRef - the ref to get the pid for
     * @returns {String}
     */
    pidForRef (aRef) {
        return aRef.getOwnProperty("*");
    }

    /**
     * @description unref the value if needed
     * @param {Object} v - the value to unref
     * @returns {Object}
     */
    unrefValueIfNeeded (v) {
        return this.unrefValue(v);
    }

    /**
     * @description unref the value
     * @param {Object} v - the value to unref
     * @returns {Object}
     */
    unrefValue (v) {
        if (Type.isLiteral(v)) {
            return v;
        }
        const puuid = v.getOwnProperty("*");
        assert(puuid);
        const obj = this.objectForPid(puuid);
        return obj;
    }

    /**
     * @description ref the value
     * @param {Object} v - the value to ref
     * @returns {Object}
     */
    refValue (v) {
        assert(!Type.isPromise(v));

        if (Type.isLiteral(v)) {
            return v;
        }

        assert(!v.isClass());

        if (!v.shouldStore()) {
            console.log("WARNING: called refValue on " + v.type() + " which has shouldStore=false");
         //   debugger;
            return null;
        }

        if (!this.hasActiveObject(v)) {
            this.addActiveObject(v);
            this.addDirtyObject(v);
        }
        const ref = { "*": v.puuid() };
        return ref;
    }

    // read a record

    /**
     * @description get the record for the given pid
     * @param {String} puuid - the pid to get the record for
     * @returns {Object}
     */
    recordForPid (puuid) { // private
        if (!this.recordsMap().hasKey(puuid)) {
            return undefined;
        }
        const jsonString = this.recordsMap().at(puuid);
        assert(Type.isString(jsonString));
        const aRecord = JSON.parse(jsonString);
        aRecord.id = puuid;
        return aRecord;
    }

    // write an object

    /**
     * @description get the kv promise for the given object
     * @param {Object} obj - the object to get the kv promise for
     * @returns {Promise}
     */
    async kvPromiseForObject (obj) {
        const record = await obj.asyncRecordForStore(this);
        const jsonString = JSON.stringify(record);
        return [obj.puuid(), jsonString];
    }

    /**
     * @description store the object
     * @param {Object} obj - the object to store
     * @returns {Object}
     */
    storeObject (obj) {
        //assert(obj.shouldStore())
        const puuid = obj.puuid()
        assert(!Type.isNullOrUndefined(puuid))

        if (obj === this.rootObject()) {
            this.setRootPid(puuid)
        }

        if (obj.asyncRecordForStore) {
            // asyncRecordForStore is only implemented if there's no 
            // synchronous option for serialization e.g. serializing a Blob
            //throw new Error("no support for asyncRecordForStore yet!")
            const kvPromise = this.kvPromiseForObject(obj)
            this.recordsMap().asyncQueueSetKvPromise(kvPromise)
        } else {
            const record = obj.recordForStore(this)
            const jsonString = JSON.stringify(record)
            this.debugLog(() => "store " + puuid + " <- " + record.type )
            this.recordsMap().set(puuid, jsonString)
            //this.storeRecord(puuid, record)
        }
        return this
    }

    /*
    storeRecord (puuid, record) {
        const jsonString = JSON.stringify(record)
        this.debugLog(() => "store " + puuid + " <- " + record.type )
        this.recordsMap().set(puuid, jsonString)
        return this
    }
    */

    // -------------------------------------

    /**
     * @description flush if needed
     * @returns {Object}
     */
    flushIfNeeded () {
        if (this.hasDirtyObjects()) {
            this.storeDirtyObjects()
            assert(!this.hasDirtyObjects())
        }
        return this
    }

    /**
     * @async
     * @description promise collect
     * @returns {Number}
     */
    async promiseCollect () {
        //debugger;
        if (Type.isUndefined(this.rootPid())) {
            console.log("---- NO ROOT PID FOR COLLECT - clearing! ----");
            await this.recordsMap().promiseBegin();
            this.recordsMap().clear();
            await this.recordsMap().promiseCommit();
            return 0;
        }

        // this is an on-disk collection
        // in-memory objects aren't considered
        // so we make sure they're flushed to the db first 
        await this.recordsMap().promiseBegin();
        this.flushIfNeeded(); // store any dirty objects

        this.debugLog(() => "--- begin collect --- with " + this.recordsMap().count() + " pids");
        this.setMarkedSet(new Set());
        this.markedSet().add(this.rootKey()); // so rootKey->rootPid entry isn't swept
        this.markPid(this.rootPid());
        this.activeObjects().forEachK(pid => this.markPid(pid));
        this.activeLazyPids().forEachK(pid => this.markPid(pid));
        const deleteCount = this.sweep();
        this.setMarkedSet(null);

        this.debugLog(() => "--- end collect --- collecting " + deleteCount + " pids ---");
       // debugger
        await this.recordsMap().promiseCommit();

        const remainingCount = this.recordsMap().count();
        this.debugLog(() => " ---- keys count after commit: " + remainingCount + " ---");
        return remainingCount;
    }

    /**
     * @description mark the pid
     * @param {String} pid - the pid to mark
     * @returns {Boolean}
     */
    markPid (pid) { // private
        //this.debugLog(() => "markPid(" + pid + ")")
        if (!this.markedSet().has(pid)) {
            this.markedSet().add(pid)
            const refPids = this.refSetForPuuid(pid)
        //    debugger
            //this.debugLog(() => "markPid " + pid + " w refs " + JSON.stringify(refPids.asArray()))
            refPids.forEach(refPid => this.markPid(refPid))
            return true
        }
        return false
    }

    /**
     * @description get the ref set for the given puuid
     * @param {String} puuid - the puuid to get the ref set for
     * @returns {Set}
     */
    refSetForPuuid (puuid) {
        const record = this.recordForPid(puuid)
        const puuids = new Set()

        if (record) {
            Object.keys(record).forEach(k => this.puuidsSetFromJson(record[k], puuids))
        }

        return puuids
    }

    /**
     * @description get the puuids set from json
     * @param {Object} json - the json to get the puuids set from
     * @param {Set} puuids - the puuids set to add to
     * @returns {Set}
     */
    puuidsSetFromJson (json, puuids = new Set()) {
        // json can only contain array's, dictionaries, and literals.
        // We store dictionaries as an array of entries, 
        // and reserve dicts in the json for pointers with the format { "*": "<puuid>" }

        //console.log(" json: ", JSON.stringify(json, null, 2))

        if (Type.isLiteral(json)) {
            // we could call refsPidsForJsonStore but none will add any pids,
            // and null raises exception, so we can just skip it for now
        } else if (Type.isObject(json) && json.refsPidsForJsonStore) {
            json.refsPidsForJsonStore(puuids)
        } else {
            throw new Error("unable to handle json type: " + typeof(json) + " missing refsPidsForJsonStore() method?")
        }
        
        return puuids
    }

    // ------------------------

    /**
     * @description sweep
     * @returns {Number}
     */
    sweep () {
        const unmarkedPidSet = this.allPidsSet().difference(this.markedSet()) // allPids doesn't contain rootKey

        // delete all unmarked records
        let deleteCount = 0
        const recordsMap = this.recordsMap()
        recordsMap.keysArray().forEach(pid => {
            if (!this.markedSet().has(pid)) {
                //this.debugLog("--- sweeping --- deletePid(" + pid + ") " + JSON.stringify(recordsMap.at(pid)))
                this.debugLog(() => "--- sweeping --- deletePid(" + pid + ") ")
                const count = recordsMap.count()
                recordsMap.removeKey(pid)
                assert(recordsMap.count() === count - 1)
                deleteCount ++
            }
        })
        return deleteCount
    }

    /**
     * @async
     * @description promise delete all
     * @returns {void}
     */
    async promiseDeleteAll () {
        await this.promiseOpen();
        assert(this.isOpen());
        // assert not loading or storing?
        const map = this.recordsMap()
        await map.promiseBegin()
        map.forEachK(pid => {
            map.removeKey(pid)
        }) // the remove applies to the changeSet
        await map.promiseCommit()
    }

    /**
     * @description promise clear
     * @returns {void}
     */
    promiseClear () {
        return this.recordsMap().promiseClear();
    }

    // ---------------------------

    /**
     * @description root subnode with title for proto
     * @param {String} aTitle - the title to get the subnode for
     * @param {Object} aProto - the proto to get the subnode for
     * @returns {Object}
     */
    rootSubnodeWithTitleForProto (aTitle, aProto) {
        return this.rootObject().subnodeWithTitleIfAbsentInsertProto(aTitle, aProto);
    }

    /**
     * @description count
     * @returns {Number}
     */
    count () {
        return this.recordsMap().count();
    }

    /**
     * @description total bytes
     * @returns {Number}
     */
    totalBytes () {
        return this.recordsMap().totalBytes();
    }

    // ---------------------------

    /*
    activeObjectsReferencingObject (anObject) {
        // useful for seeing if we can unload an object
        // BUT, to do full collect, do a mark/sweep on active objects
        // where sweep only removes unmarked from activeObjects and records cache?

        assert(this.hasActiveObject(anObject)) 

        const referencers = new Set()
        const pid = anObject.puuid()

        this.activeObjects().forEachKV((pid, obj) => {
            const refPids = this.refSetForPuuid(obj.puuid())
            if (refPids.has(pid)) {
                referencers.add(obj)
            }
        })

        return referencers
    }
    */

    /*
    static selfTestRoot () {
        const aTypedArray = Float64Array.from([1.2, 3.4, 4.5])
        const aSet = new Set("sv1", "sv2")
        const aMap = new Map([ ["mk1", "mv1"], ["mk2", "mv2"] ])
        const aNode = BMStorableNode.clone()
        const a = [1, 2, [3, null], { foo: "bar", b: true }, aSet, aMap, new Date(), aTypedArray, aNode]
        return a
    }

    static selfTest () {
        console.log(this.type() + " --- self test start --- ")
        const store = ObjectPool.clone()
        store.open()

        store.rootOrIfAbsentFromClosure(() => BMStorableNode.clone())
        store.flushIfNeeded()
        console.log("store:", store.asJson())
        console.log(" --- ")
        store.promiseCollect()
        store.clearCache()
        const loadedNode = store.rootObject()
        console.log("loadedNode = ", loadedNode)
        console.log(this.type() + " --- self test end --- ")
    }
    */

}.initThisClass());



