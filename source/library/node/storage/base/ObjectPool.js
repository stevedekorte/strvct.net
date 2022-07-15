"use strict";

/*

    ObjectPool

        For persisting a object tree to a JSON formatted representation and back.
        Usefull for both persistence and exporting object out the the app/browser and onto desktop or other browsers.

        This is a parent class for PersistentObjectPool, which just swaps out the recordDict AtomicDictionary, 
        with a PersistentAtomicDictionary.

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
            const rootNode = ObjectPool.clone().fromJson(poolJson).root()

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
    
    initPrototype () {
        this.newSlot("name", "defaultDataStore")
        this.newSlot("rootObject", null)

        // AtomicDictionary
        this.newSlot("recordsDict", null) 

        // dict - objects known to the pool (previously loaded or referenced)
        this.newSlot("activeObjects", null) 

        // dict - subset of activeObjects containing objects with mutations that need to be stored
        this.newSlot("dirtyObjects", null)

        // set - pids of objects that we're loading in this event loop
        this.newSlot("loadingPids", null)

        // Set - pids of objects that we're storing in this event loop
        this.newSlot("storingPids", null)

        // Date - WARNING: vulnerable to system time changes/differences
        this.newSlot("lastSyncTime", null)

        //this.newSlot("isReadOnly", false)

        // Set of puuids
        this.newSlot("markedSet", null) 

        // Notification - sent after pool opens - TODO: change name to objectPoolDidOpen?
        this.newSlot("nodeStoreDidOpenNote", null)

        // set to true during method didInitLoadingPids() - used to ignore mutations during this period
        this.newSlot("isFinalizing", false)

        // object to receive success and error callbacks, particularly for async methods
        // in this way, we can more easily use the same code with both sync and async versions
        this.newSlot("delegate", null) 

        this.newSlot("error", null) // most recent error, if any
    }

    init () {
        super.init()
        this.setRecordsDict(ideal.AtomicDictionary.clone())
        this.setActiveObjects({})
        this.setDirtyObjects({})
        this.setLoadingPids(new Set())
        this.setLastSyncTime(null)
        this.setMarkedSet(null)
        this.setNodeStoreDidOpenNote(this.newNoteNamed("nodeStoreDidOpen"))
        this.setIsDebugging(false)
        return this
    }

    clearCache () {
        this.setActiveObjects({})
        this.setDirtyObjects({})
        this.readRoot()
        //this.setRootObject(this.objectForPid(this.rootObject().puuid()))
        return this
    }

    // --- open ---

    open () { // this class can also be used with synchronous AtomicDictionary
        this.recordsDict().setName(this.name())
        this.recordsDict().open()
        this.onPoolOpenSuccess()
        return this
    }

    asyncOpen (successCallback, errorCallback) { 
        this.recordsDict().setName(this.name())
        this.recordsDict().asyncOpen(
            () => this.onPoolOpenSuccess(), 
            (error) => this.onPoolOpenFailure(error)
        )
        /*
            this.recordsDict().asyncOpen(
            () => { this.onPoolOpenSuccess(); successCallback() }, 
            (error) => { this.onPoolOpenError(error); errorCallback(); }
        )
        */
        return this
    }

    sendDelegate (methodName, argument) {
        const d = this.delegate()
        if (d) {
            const m = d[methodName]
            if (m) {
                m.apply(d, this, argument)
            }
        }
    }

    onPoolOpenSuccess () {
        this.onRecordsDictOpen()
        this.sendDelegate("onPoolOpenSuccess")
    }

    onPoolOpenFailure (error) {
        this.sendDelegate("onPoolOpenFailure", error)
    }

    /*
    postOpenNote () {
        this.postNoteNamed("objectPoolDidOpen")
    }
    */

    onRecordsDictOpen () {
        this.collect()
        //this.readRoot()
        this.nodeStoreDidOpenNote().post()
        return this
    }

    isOpen () {
        return this.recordsDict().isOpen()
    }

    // --- root ---

    rootKey () {
        return "root"
    }

    hasStoredRoot () {
        return this.recordsDict().hasKey(this.rootKey())
    }

    rootOrIfAbsentFromClosure (aClosure) {
        if (!this.hasStoredRoot()) {
            const newRoot = aClosure()
            assert(newRoot)
            this.setRootObject(newRoot)
        }
        return this.rootObject()
    }

    readRoot () {
        //console.log(" this.hasStoredRoot() = " + this.hasStoredRoot())
        if (this.hasStoredRoot()) {
            const rootRecord = this.recordForPid(this.rootKey())
            //console.log("rootRecord.subnodes: ", JSON.stringify(rootRecord, null, 2))

            const root = this.objectForPid(this.rootKey())

            this._rootObject = root
            //this.setRootObject(root) // this is for setting up new root
        }
        return this.rootObject()
    }

    knowsObject (obj) { // private
        const puuid = obj.puuid()
        const foundIt = this.recordsDict().hasKey(puuid) ||
            this.activeObjects().hasOwnProperty(puuid) ||
            this.dirtyObjects().hasOwnProperty(puuid)
        return foundIt
    }

    assertOpen () {
        assert(this.isOpen())
    }

    changeOldPidToNewPid (oldPid, newPid) {
        // flush and change pids on all activeObjects 
        // and pids and pidRefs in recordsDict 
        throw new Error("unimplemented")
        return this
    }
    
    setRootObject (obj) { // only used for setting up a new root object
        this.assertOpen()
        if (this._rootObject) {
            // can support this if we change all stored and
            //this.changeOldPidToNewPid("root", Object.newUuid())
            throw new Error("can't change root object yet, unimplemented")
        }

        assert(!this.knowsObject(obj))

        obj.setPuuid(this.rootKey())
        this._rootObject = obj
        this.addActiveObject(obj)
        this.addDirtyObject(obj)
        
        return this
    }

    // ---  ---

    asJson () {
        return this.recordsDict().asJson()
    }

    updateLastSyncTime () {
        this.setLastSyncTime(Date.now())
        return this
    }

    // --- active and dirty objects ---

    hasActiveObject (anObject) {
        const puuid = anObject.puuid()
        return this.activeObjects().hasOwnProperty(puuid)
    }
    
    addActiveObject (anObject) {
        assert(!anObject.isClass())

        if (!anObject.shouldStore()) {
            const msg = "attempt to addActiveObject '" + anObject.type() + "' but shouldStore is false"
            console.log(msg)
            anObject.shouldStore()
            throw new Error(msg)
        //return false
        }

        if (!anObject.isInstance()) {
            const msg = "can't store non instance of type '" + anObject.type() + "'"
            console.log(msg)
            anObject.isKindOf(ProtoClass) 
            throw new Error(msg)
        }

        /*
        // some old debugging code - leave here for now
        if (!anObject.isKindOf(ProtoClass) && !anObject.isKindOf(SubnodesArray)) {
        //if (["Object", "PersistentObjectPool", "Set", "Map"].contains(anObject.type())) {
            const msg = "can't store object of type '" + anObject.type() + "'"
            console.log("---")
            console.log(msg)
            console.log("---")
            //anObject.isKindOf(ProtoClass) 
            Object.shouldStore() 
            let path = anObject.slotValuePath("_shouldStore")
            console.log("_shouldStore path:", JSON.stringify(path))
            path = anObject.slotValuePath("shouldStore")
            console.log("shouldStore path:", path)
            anObject.shouldStore() 

            throw new Error(msg)
        }
        */

        if (!this.hasActiveObject(anObject)) {
            anObject.addMutationObserver(this)
            this.activeObjects().atSlotPut(anObject.puuid(), anObject)
            //this.addDirtyObject(anObject)
        }

        return true
    }

    close () {
        this.removeMutationObservations()
        this.setActiveObjects({})
        this.setDirtyObjects({})
        return this
    }

    removeMutationObservations () {
        this.activeObjects().forEach(obj => obj.removeMutationObserver(this)) // activeObjects is super set of dirtyObjects
        return this
    }

    hasDirtyObjects () {
        return Object.keys(this.dirtyObjects()).length !== 0
    }

    /*
    hasDirtyObject (anObject) {
        const puuid = anObject.puuid()
        return this.dirtyObjects().hasOwnProperty(puuid)
    }
    */

    onObjectUpdatePid (anObject, oldPid, newPid) {
        // sanity check for debugging - could remove later
        if (this.hasActiveObject(anObject)) {
            const msg = "onObjectUpdatePid " + anObject.typeId() + " " + oldPid + " -> " + newPid
            console.log(msg)
            throw new Error(msg)
        }
    }

    onDidMutateObject (anObject) {
        //if (anObject.hasDoneInit() && ) {
        if (this.hasActiveObject(anObject) && !this.isLoadingObject(anObject)) {
            this.addDirtyObject(anObject)
        }
    }

    isStoringObject (anObject) {
        const puuid = anObject.puuid()
        if (this.storingPids()) {
            if (this.storingPids().has(puuid)) {
                return true
            }
        }
        return false
    }

    isLoadingObject (anObject) { // private
        if (this.loadingPids()) {
            if (this.loadingPids().has(puuid)) {
                return true
            }
        }
        return false
    }

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

        if (!this.dirtyObjects().hasOwnProperty(puuid)) {
            this.debugLog(() => "addDirtyObject(" + anObject.typeId() + ")" )
            if (this.storingPids() && this.storingPids().has(puuid)) {
                throw new Error("attempt to double store? did object change after store? is there a loop?")
            }
            this.dirtyObjects()[puuid] = anObject
            this.scheduleStore()
        }

        return this
    }

    scheduleStore () {
        if (!this.isOpen()) {
            console.log(this.typeId() + " can't schedule store yet, not open")
            return this
        }
        assert(this.isOpen())
        const scheduler = SyncScheduler.shared()
        const methodName = "commitStoreDirtyObjects"
        if (!scheduler.isSyncingTargetAndMethod(this, methodName)) {
            if (!scheduler.hasScheduledTargetAndMethod(this, methodName)) {
                //console.warn("scheduleStore currentAction = ", SyncScheduler.currentAction() ? SyncScheduler.currentAction().description() : null)
                scheduler.scheduleTargetAndMethod(this, methodName, 1000)
            }
        }
        return this
    }

    // --- storing ---

    commitStoreDirtyObjects () {
        if (this.hasDirtyObjects()) {
            this.debugLog("--- commitStoreDirtyObjects begin ---")
            this.recordsDict().begin()
            const storeCount = this.storeDirtyObjects()
            this.recordsDict().commit()
            this.debugLog("--- commitStoreDirtyObjects end --- stored " + storeCount + " objects")
        }
    }

    storeDirtyObjects () { // PRIVATE
        // store the dirty objects, if they contain references objects unknown to pool,
        // they'll be added as active + dirty objects which will be stored on next loop. 
        // We continue until there are no dirty objects left.

        let totalStoreCount = 0
        this.setStoringPids(new Set())

        while (true) { // easier to express clearly than do/while in this case
            let thisLoopStoreCount = 0
            const dirtyBucket = this.dirtyObjects()
            this.setDirtyObjects({})

            dirtyBucket.ownForEachKV((puuid, obj) => {
                //console.log("  storing pid " + puuid)

                if (this.storingPids().has(puuid)) {
                    const msg = "ERROR: attempt to double store " + obj.typeId()
                    console.log(msg)
                    throw new Error(msg)
                }

                this.storingPids().add(puuid)
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

    classNameConversionDict () {
        return {}
        /*
        return { 
            "BMMenuNode" : "BMFolderNode",
            "KinsaResources" : "Kinsa",
            "BMCamStore" : "BMCams",
        }
        */
        /*
        return {
            "BMThemeFolder" : "BMFolderNode",
            "BMThemeAttribute" : "BMStringField",
        }
        */
    }

    classForName (className) { 
        const altClassName = this.classNameConversionDict()[className]

        if (altClassName) {
            return Object.getClassNamed(altClassName)
        } 

        return Object.getClassNamed(className)
    }

    objectForRecord (aRecord) { // private
        const className = aRecord.type
        //console.log("loading " + className + " " + aRecord.id)
        const aClass = this.classForName(className)

        if (!aClass) {
            throw new Error("missing class '" + className + "'")
        }
        
        assert(!Type.isNullOrUndefined(aRecord.id))
        const obj = aClass.instanceFromRecordInStore(aRecord, this)
        assert(!this.hasActiveObject(obj))
        obj.setPuuid(aRecord.id)
        this.addActiveObject(obj)
        obj.loadFromRecord(aRecord, this)
        return obj
    }

    activeObjectForPid (puuid) {
        return this.activeObjects().getOwnProperty(puuid)
    }

    objectForPid (puuid) { // PRIVATE (except also used by StoreRef)
        //console.log("objectForPid " + puuid)

        // return active object for pid, if there is one
        const activeObj = this.activeObjectForPid(puuid)
        if (activeObj) {
            return activeObj
        }

        // schedule didInitLoadingPids to occur at end of event loop 

        if (!this.isFinalizing() && this.loadingPids().size === 0) {
            SyncScheduler.shared().scheduleTargetAndMethod(this, "didInitLoadingPids")
        }

        this.loadingPids().add(puuid)
        
        const aRecord = this.recordForPid(puuid)
        if (Type.isUndefined(aRecord)) {
            return undefined
        }
        const loadedObj = this.objectForRecord(aRecord)
        return loadedObj
    }

    didInitLoadingPids () {
        assert(!this.isFinalizing()) // sanity check
        this.setIsFinalizing(true)
        while (!this.loadingPids().isEmpty()) { // while there are still loading pids
            const lastSet = this.loadingPids()
            this.setLoadingPids(new Set())

            lastSet.forEach(loadedPid => { // sends didLoadFromStore to each matching object
                const obj = this.activeObjectForPid(loadedPid)
                if (obj.didLoadFromStore) {
                    obj.didLoadFromStore() // should this be able to trigger an objectForPid() that would add to loadingPids?
                }
            })
        }
        this.setIsFinalizing(false)
    }

    //

    allPids () {
        return this.recordsDict().keys()
    }

    activeLazyPids () { // returns a set of pids
        const pids = new Set()
        this.activeObjects().ownForEachKV((pid, obj) => {
            if (obj.lazyPids) {
                obj.lazyPids(pids)
            }
        })
        return pids
    }

    // --- references ---

    refForPid (aPid) {
        return { "*": this.pid() }
    }

    pidForRef (aRef) {
        return aRef.getOwnProperty("*")
    }

    unrefValueIfNeeded (v) {
        return this.unrefValue(v)
    }

    unrefValue (v) {
        if (Type.isLiteral(v)) {
            return v
        }
        const puuid = v.getOwnProperty("*")
        assert(puuid)
        const obj = this.objectForPid(puuid)
        return obj
    }

    refValue (v) {
        if (Type.isLiteral(v)) {
            return v
        }

        assert(!v.isClass())

        if (!v.shouldStore()) {
            console.log("WARNING: called refValue on " + v.type() + " which has shouldStore=false")
            return null
        }

        if (!this.hasActiveObject(v)) {
            this.addActiveObject(v)
            this.addDirtyObject(v)
        }

        this.addActiveObject(v)
        const ref = { "*": v.puuid() }
        return ref
    }

    // read a record

    recordForPid (puuid) { // private
        if (!this.recordsDict().hasKey(puuid)) {
            return undefined
        }
        const jsonString = this.recordsDict().at(puuid)
        assert(Type.isString(jsonString))
        const aRecord = JSON.parse(jsonString)
        aRecord.id = puuid
        return aRecord
    }

    // write an object

    storeObject (obj) {
        assert(obj.shouldStore())

        const puuid = obj.puuid()
        assert(!Type.isNullOrUndefined(puuid))
        const v = JSON.stringify(obj.recordForStore(this))
        this.debugLog(() => "store " + obj.puuid() + " <- " + v )
        this.recordsDict().atPut(puuid, v)
        return this
    }

    // -------------------------------------

    flushIfNeeded () {
        if (this.hasDirtyObjects()) {
            this.storeDirtyObjects()
            assert(!this.hasDirtyObjects())
        }
        return this
    }

    collect () {
        // this is an on-disk collection
        // in-memory objects aren't considered
        // so we make sure they're flushed to the db first 
        this.recordsDict().begin()
        this.flushIfNeeded() // store any dirty objects

        this.debugLog(() => "--- begin collect --- with " + this.recordsDict().keys().length + " pids")
        this.setMarkedSet(new Set())
        this.markPid(this.rootKey())
        this.activeObjects().ownForEachKV((pid, obj) => this.markPid(pid))
        this.activeLazyPids().forEach(pid => this.markPid(pid))
        const deleteCount = this.sweep()
        this.setMarkedSet(null)

        this.recordsDict().commit()
        this.debugLog(() => "--- end collect --- collected " + deleteCount + " pids ---")

        let remainingCount = this.recordsDict().size()
        this.debugLog(() => " remaining keys after commit: " + remainingCount)
        return deleteCount
    }

    markPid (pid) { // private
        //this.debugLog(() => "markPid(" + pid + ")")
        if (!this.markedSet().has(pid)) {
            this.markedSet().add(pid)
            const refPids = this.refSetForPuuid(pid)
            //this.debugLog(() => "markPid " + pid + " w refs " + JSON.stringify(refPids))
            refPids.forEach(refPid => this.markPid(refPid))
            return true
        }
        return false
    }

    refSetForPuuid (puuid) {
        const record = this.recordForPid(puuid)
        const puuids = new Set()

        if (record) {
            Object.keys(record).forEach(k => this.puuidsSetFromJson(record[k], puuids))
        }

        return puuids
    }

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

    sweep () {
        // delete all unmarked records
        let deleteCount = 0
        const recordsDict = this.recordsDict()
        this.recordsDict().keys().forEach((pid) => {
            if (!this.markedSet().has(pid)) {
                //this.debugLog("deletePid(" + pid + ")")
                const count = recordsDict.keys().length
                recordsDict.removeKey(pid)
                assert(recordsDict.keys().length === count - 1)
                deleteCount ++
            }
        })
        return deleteCount
    }

    deleteAll () {
        assert(this.isOpen())
        // assert not loading or storing?
        const dict = this.recordsDict()
        dict.begin()
        dict.keys().forEach(pid => dict.removeKey(pid))
        dict.commit()
        return this
    }

    asyncClear (successCallback) {
        this.recordsDict().asyncClear(successCallback)
    }

    // ---------------------------

    rootSubnodeWithTitleForProto (aTitle, aProto) {
        return this.rootObject().subnodeWithTitleIfAbsentInsertProto(aTitle, aProto)
    }

    totalBytes () {
        return this.recordsDict().totalBytes()
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

        this.activeObjects().forEach((obj) => {
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
        store.collect()
        store.clearCache()
        const loadedNode = store.rootObject()
        console.log("loadedNode = ", loadedNode)
        console.log(this.type() + " --- self test end --- ")
    }
    */

}.initThisClass());


// -------------------

/*
setTimeout(() => {
    ObjectPool.selfTest()
}, 1000)
*/


