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

    static instanceFromRecordInStore (/*aRecord, aStore*/) {
        throw new Error("We should not be calling instanceFromRecordInStore on ObjectPool");
    }

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
         * @member {AtomicMap} kvMap
         * @description the map of records for the object pool
         * @default null
         */
        {
            const slot = this.newSlot("kvMap", null);
            slot.setSlotType("AtomicMap");
        }

        /**
         * @member {EnumerableWeakMap} activeObjects
         * @description objects known to the pool (previously loaded or referenced)
         * @default null
         */
        {
            const slot = this.newSlot("activeObjects", null);
            slot.setDescription("objects known to the pool (previously loaded or referenced)");
            slot.setSlotType("EnumerableWeakMap");
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
         * @member {SvNotification} nodeStoreDidOpenNote
         * @description Notification sent after pool opens
         * @default null
         */
        // TODO: change name to objectPoolDidOpen?
        {
            const slot = this.newSlot("nodeStoreDidOpenNote", null);
            slot.setDescription("Notification sent after pool opens");
            slot.setSlotType("SvNotification");
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
        super.init();
        this.setKvMap(ideal.AtomicMap.clone());
        this.setActiveObjects(new EnumerableWeakMap());
        this.setDirtyObjects(new Map());
        this.setLoadingPids(new Set());
        this.setLastSyncTime(null);
        this.setMarkedSet(null);
        this.setNodeStoreDidOpenNote(this.newNoteNamed("nodeStoreDidOpen"));
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description set the debugging flag
     * @param {Boolean} b - the new debugging flag value
     * @returns {ObjectPool}
     */
    setIsDebugging (b) {
        if (b === false && this.isDebugging() === true) {
            // make sure we're changing this for a good reason
        }
        super.setIsDebugging(b);
        return this;
    }

    /**
     * @description clear the cache
     * @returns {ObjectPool}
     */
    clearCache () {
        this.setActiveObjects(new EnumerableWeakMap());
        this.setDirtyObjects(new Map());
        this.readRootObject();
        //this.setRootObject(this.objectForPid(this.rootObject().puuid()));
        return this;
    }

    // --- open ---

    /*
    open () { // this class can also be used with synchronous AtomicMap
        this.kvMap().setName(this.name());
        this.kvMap().open();
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
        const map = this.kvMap();
        if (map.isOpen() && map.name() === this.name()) {
            return this;
        }
        map.setName(this.name());
        try {
            await map.promiseOpen();
            await this.onPoolOpenSuccess();
        } catch (error) {
            this.onPoolOpenFailure(error);
        }
    }

    async promiseClose () {
        const map = this.kvMap();
        if (map.isOpen()) {
            map.close(); // this is synchronous in indexeddb
            //await map.promiseClose();
        }
    }

    /**
     * @async
     * @description called when the pool opens successfully
     * @returns {Promise}
     */
    async onPoolOpenSuccess () {
        // here so subclasses can easily hook
        await this.onRecordsDictOpen();
    }

    /**
     * @description called when the pool opens successfully
     * @param {Error} error - the error that occurred
     * @returns {void}
     */
    onPoolOpenFailure (error) {
        // here so subclasses can easily hook
        throw error;
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
        const comment = s ? " " + s + " " : "";
        console.log("---" + comment + "---");
        const max = 40;
        console.log(this.kvMap().count() + " records: ");
        this.kvMap().forEachKV((k, v) => {
            if (v.length > max) {
                v = v.slice(0, max) + "...";
            }
            console.log("   '" + k + "': '" + v + "'");
        });

        console.log("------");
    }

    /**
     * @async
     * @description called when the records map opens successfully
     * @returns {Promise}
     */
    async onRecordsDictOpen () {
        //this.show("ON OPEN");
        await this.promiseCollect();
        //this.show("AFTER COLLECT");
        this.nodeStoreDidOpenNote().post();
        return this;
    }

    /**
     * @description check if the object pool is open
     * @returns {Boolean}
     */
    isOpen () {
        return this.kvMap().isOpen();
    }

    // --- root ---

    /**
     * @description get the root key
     * @returns {String}
     */
    rootKey () {
        return "root";
    }

    /**
     * @description set the root pid
     * @param {String} pid - the new root pid
     * @returns {ObjectPool}
     */
    setRootPid (pid) {
        // private - it's assumed we aren't already in storing-dirty-objects tx
        const map = this.kvMap();
        if (map.at(this.rootKey()) !== pid) {
            map.atPut(this.rootKey(), pid);
            console.log(this.logPrefix() + "---- SET ROOT PID " + pid + " ----");

        }
        assert(this.hasStoredRoot());
        return this;
    }

    /**
     * @description get the root pid
     * @returns {String}
     */
    rootPid () {
        return this.kvMap().at(this.rootKey());
    }

    /**
     * @description check if the root has been stored
     * @returns {Boolean}
     */
    hasStoredRoot () {
        return this.kvMap().hasKey(this.rootKey());
    }

    hasValidStoredRoot () {
        if (this.hasStoredRoot()) {
            const root = this.objectForPid(this.rootPid());
            if (Type.isNullOrUndefined(root)) {
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * @description get the root object or create it if it doesn't exist
     * @param {Function} aClosure - the closure to create the root object if it doesn't exist
     * @returns {Object}
     */
    rootOrIfAbsentFromClosure (aClosure) {
        if (this.hasValidStoredRoot()) {
            this.readRootObject();
        } else {
            const newRoot = aClosure();
            assert(newRoot);
            this.setRootObject(newRoot);
        }
        return this.rootObject();
    }

    // ok, if we want to use an already allocated Application root object,
    // we need to do this:
    setupForRootObject (appRootObject) {
        if (this.hasStoredRoot()) {
            this.readRootObject();

            // now let's do some sanity checks
            assert(appRootObject.puuid() !== this.rootPid(), "appRootObject.puuid() === this.rootPid()");
            assert(appRootObject !== this.rootObject(), "appRootObject.puuid() === this.rootPid()");

            // now we need to map the stored root object to our app root object
            // to do this, we'll get the pid of the current root and
            // set the pid of the app root to it, then update our pid->object map

            const storedRootPid = this.rootPid();
            const appRootPid = appRootObject.puuid();

            const map = this.kvMap();

            // Make sure there are no refs to this first
            const refs = this.objectSetReferencingPid(appRootPid);
            refs.delete(appRootObject);
            assert(refs.size === 0, "there are still stored refs to the app root object");
            // TODO:what about dirty objects?

            // read the old record into the new object
            const oldRecord = this.recordForPid(storedRootPid);
            appRootObject.loadFromRecord(oldRecord, this);

            map.removeAt(appRootPid);
            appRootObject.justSetPuuid(storedRootPid);
            map.atPut(storedRootPid, appRootObject);

            // now we need to update the active objects
            this.addActiveObject(appRootObject);
            this.addDirtyObject(obj);appRootObject;

        } else {
            this.setRootObject(rootObject);
        }
        return this;
    }

    /**
     * @description read the root object
     * @returns {Object}
     */
    readRootObject () {
        //console.log(this.logPrefix() + " this.hasStoredRoot() = " + this.hasStoredRoot())

        if (this.hasStoredRoot()) {
            const root = this.objectForPid(this.rootPid()); // this call will actually internally set this._rootObject as we may need it while loading the root's refs
            //assert(!Type.isNullOrUndefined(root), this.svType() + " rootObject is null or undefined");
            if (Type.isNullOrUndefined(root)) {
                // this can happen is the root object class doesn't exist anymore
                console.log(this.logPrefix() + "readRootObject() rootObject is null or undefined");
                // we'll let the caller handle this
                return null;
            }
            this._rootObject = root;
            //this.setRootObject(root); // this is for setting up new root
            return this.rootObject();
        }
        throw new Error("missing root object");
    }

    /**
     * @description check if the object pool knows about the object. Does not check if the object is referenced within records, it should be in the kvMap if it is.
     * @param {Object} obj - the object to check
     * @returns {Boolean}
     */
    knowsObject (obj) { // private
        const puuid = obj.puuid();
        const foundIt = this.kvMap().hasKey(puuid) ||
            this.activeObjects().has(puuid) ||
            this.dirtyObjects().has(puuid); // dirty objects check redundant with activeObjects?
        return foundIt;
    }

    /**
     * @description assert that the object pool is open
     * @returns {void}
     */
    assertOpen () {
        assert(this.isOpen());
    }

    /*
    changeOldPidToNewPid (oldPid, newPid) {
        // flush and change pids on all activeObjects
        // and pids and pidRefs in kvMap
        throw new Error("unimplemented");
        return this;
    }
    */

    /**
     * @description set the root object
     * @param {Object} obj - the new root object
     * @returns {ObjectPool}
     */
    setRootObject (obj) { // only used for setting up a new root object
        this.assertOpen();
        if (this._rootObject) {
            // can support this if we change all stored and
            //this.changeOldPidToNewPid("root", Object.newUuid());
            throw new Error("can't change root object yet, unimplemented");
        }

        assert(!this.knowsObject(obj));


        //this.setRootPid(obj.puuid()); // this is set when the dirty root object is stored
        this._rootObject = obj;
        this.logDebug(" adding rootObject " + obj.svDebugId());
        this.addActiveObject(obj);
        this.addDirtyObject(obj);
        return this;
    }

    // ---  ---

    /**
     * @description convert the records map to a JSON string
     * @returns {String}
     */
    asJson () {
        return this.kvMap().asJson();
    }

    /**
     * @description update the last sync time
     * @returns {ObjectPool}
     */
    updateLastSyncTime () {
        this.setLastSyncTime(Date.now());
        return this;
    }

    // --- active and dirty objects ---

    /**
     * @description check if the object pool has the active object
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    hasActiveObject (anObject) {
        const puuid = anObject.puuid();
        return this.activeObjects().has(puuid);
    }

    /**
     * @description add an active object
     * @param {Object} anObject - the object to add
     * @returns {Boolean}
     */
    addActiveObject (anObject) {
        assert(!anObject.isClass());

        /*
        if (Type.isDictionary(anObject)) {
        }
        */
        /*
        if (anObject.svType() === "Error") {
            return false;
        }
        */


        if (Type.typeName(anObject) === "PersistentObjectPool") {
            const msg = "addActiveObject() called with PersistentObjectPool";
            console.warn(this.logPrefix() + msg);
            throw new Error(msg);
            //return false;
        }

        if (!anObject.shouldStore()) {
            const msg = "attempt to addActiveObject '" + anObject.svType() + "' but shouldStore is false. Adding anyway so we don't load it multiple times. Let's hope it's garbage collected.";
            console.warn(this.logPrefix() + msg);
            //anObject.shouldStore();
            //throw new Error(msg);
            //return false;
        }

        if (!anObject.isInstance()) {
            const msg = "can't store non instance of type '" + anObject.svType() + "'";
            console.warn(this.logPrefix() + msg);
            anObject.isKindOf(ProtoClass);
            throw new Error(msg);
        }

        if (!this.hasActiveObject(anObject)) {
            //const title = anObject.title ? anObject.title() : "-";
            //this.logDebug(() => anObject.svDebugId() + ".addMutationObserver(" + this.svDebugId() + " '" + title + "')");
            anObject.addMutationObserver(this);
            this.activeObjects().set(anObject.puuid(), anObject);
            //this.addDirtyObject(anObject);
        }

        return true;
    }

    /**
     * @description close the object pool
     * @returns {ObjectPool}
     */
    close () {
        this.removeMutationObservations();
        this.setActiveObjects(new EnumerableWeakMap());
        this.setDirtyObjects(new Map());
        this.kvMap().close();
        return this;
    }

    /**
     * @description remove mutation observations
     * @returns {ObjectPool}
     */
    removeMutationObservations () {
        this.activeObjects().forEachKV((puuid, obj) => obj.removeMutationObserver(this)); // activeObjects is super set of dirtyObjects
        return this;
    }

    /**
     * @description check if the object pool has dirty objects
     * @returns {Boolean}
     */
    hasDirtyObjects () {
        return !this.dirtyObjects().isEmpty();
    }

    /*
    hasDirtyObject (anObject) {
        const puuid = anObject.puuid();
        return this.dirtyObjects().has(puuid);
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
            const msg = "onObjectUpdatePid " + anObject.svTypeId() + " " + oldPid + " -> " + newPid;
            console.log(this.logPrefix() + msg);
            throw new Error(msg);
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
            this.addDirtyObject(anObject);
        }
    }

    /**
     * @description check if the object is being stored
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    isStoringObject (anObject) {
        const puuid = anObject.puuid();
        if (this.storingPids()) {
            if (this.storingPids().has(puuid)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description check if the object is being loaded
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    isLoadingObject (anObject) { // private
        if (this.loadingPids()) {
            if (this.loadingPids().has(anObject.puuid())) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description add a dirty object
     * @param {Object} anObject - the object to add
     * @returns {ObjectPool}
     */
    addDirtyObject (anObject) { // private
        if (anObject.thisClass && anObject.thisClass().isKindOf(ObjectPool)) {
            throw new Error("attempt to addDirtyObject " + anObject.svTypeId() + " which is an ObjectPool");
        }
        if (!this.hasActiveObject(anObject)) {
            console.log(this.logPrefix() + "looks like it hasn't been referenced yet");
            throw new Error("not referenced yet");
        }

        const puuid = anObject.puuid();

        if (this.isStoringObject(anObject)) {
            return this;
        }

        if (this.isLoadingObject(anObject)) {
            return this;
        }

        if (!this.dirtyObjects().has(puuid)) {
            this.logDebug(() => "addDirtyObject(" + anObject.svTypeId() + ")");
            if (this.storingPids() && this.storingPids().has(puuid)) {
                throw new Error("attempt to double store? did object change after store? is there a loop?");
            }
            this.dirtyObjects().set(puuid, anObject);
            this.scheduleStore();
        }

        return this;
    }

    /**
     * @description force add a dirty object - only use for when we change slots while loading an object from the store
     * @param {Object} anObject - the object to force add
     * @returns {ObjectPool}
     */
    forceAddDirtyObject (anObject) {
        console.log(this.logPrefix() + "forceAddDirtyObject(" + anObject.svTypeId() + ")");
        if (this.storingPids() !== null) {
            // we might be in the middle of storing changes
            if (this.storingPids().has(anObject.puuid())) {
                // looks like this object is already queued to be stored
                console.log(this.logPrefix() + "forceAddDirtyObject(" + anObject.svTypeId() + ") already queued to be stored - skipping");
                return this;
            }
        }
        if (!this._forcedDirtyObjectsSet) {
            this._forcedDirtyObjectsSet = new Set();
        }
        this._forcedDirtyObjectsSet.add(anObject);

        this.dirtyObjects().set(anObject.puuid(), anObject);
        this.scheduleStore();
        return this;
    }

    /**
     * @description schedule the store of dirty objects
     * @returns {ObjectPool}
     */
    scheduleStore () {
        if (!this.isOpen()) {
            console.log(this.logPrefix() + " can't schedule store yet, not open");
            return this;
        }
        assert(this.isOpen());
        const scheduler = SvSyncScheduler.shared();
        const methodName = "commitStoreDirtyObjects";
        //console.log(this.svType() + " --- scheduleStore ---")
        if (!scheduler.isSyncingTargetAndMethod(this, methodName)) {
            if (!scheduler.hasScheduledTargetAndMethod(this, methodName)) {
                //console.warn("scheduleStore currentAction = ", SvSyncScheduler.currentAction() ? SvSyncScheduler.currentAction().description() : null);
                this.logDebug("scheduling commitStoreDirtyObjects dirty object count:" + this.dirtyObjects().size);
                scheduler.scheduleTargetAndMethod(this, methodName, 1000);
            }
        }
        return this;
    }

    // --- storing ---

    /**
     * @asynca
     * @description commit the store of dirty objects
     * @returns {void}
     */
    async commitStoreDirtyObjects () {
        this.logDebug("commitStoreDirtyObjects dirty object count:" + this.dirtyObjects().size);

        if (this.hasDirtyObjects()) {
            //console.log(this.svType() + " --- commitStoreDirtyObjects ---");

            //this.logDebug("--- commitStoreDirtyObjects begin ---");
            await this.kvMap().promiseBegin();
            const storeCount = this.storeDirtyObjects();
            await this.kvMap().promiseCommit();
            this.logDebug("--- commitStoreDirtyObjects end --- stored " + storeCount + " objects");
            this.logDebug("--- commitStoreDirtyObjects total objects: " + this.kvMap().count());

            //this.show("AFTER commitStoreDirtyObjects");

            if (this._forcedDirtyObjectsSet) {
                if (this._forcedDirtyObjectsSet.size !== 0) {
                    console.log(this.logPrefix() + "forceDirectObjectsSet is not empty! scheduling another store to get the rest");
                    this.scheduleStore();
                } else {
                    console.log(this.logPrefix() + "--- commitStoreDirtyObjects end -- all forced dirty objects were stored!");
                    this._forcedDirtyObjectsSet = null;
                }
            }
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

        let totalStoreCount = 0;
        this.setStoringPids(new Set());

        for (;;) { // easier to express clearly than do/while in this case
            let thisLoopStoreCount = 0;
            const dirtyBucket = this.dirtyObjects();
            this.setDirtyObjects(new Map());

            dirtyBucket.forEachKV((puuid, obj) => {
                //console.log("  storing pid " + puuid);

                if (this.storingPids().has(puuid)) {
                    const msg = "ERROR: attempt to double store " + obj.svTypeId();
                    console.log(msg);
                    throw new Error(msg);
                }

                this.storingPids().add(puuid);

                if (this._forcedDirtyObjectsSet && this._forcedDirtyObjectsSet.has(obj)) {
                    console.log(this.logPrefix() + " storing forced dirty object (" + obj.svTypeId() + ") ");
                    this._forcedDirtyObjectsSet.delete(obj);
                }

                this.storeObject(obj);

                thisLoopStoreCount ++;
            });

            if (thisLoopStoreCount === 0) {
                break;
            }

            totalStoreCount += thisLoopStoreCount;
            //this.logDebug(() => "totalStoreCount: " + totalStoreCount);
        }

        this.setStoringPids(null);
        return totalStoreCount;
    }

    // --- reading ---

    /**
     * @description get the className conversion map
     * @returns {Map}
     */
    classNameConversionMap () {
        const m = new Map();
        /*
        m.set("SvMenuNode", "SvFolderNode")
        */
        return m;
    }

    /**
     * @description get the class for the given name
     * @param {String} className - the name of the class
     * @returns {Class}
     */
    classForName (className) {
        const m = this.classNameConversionMap();
        if (m.has(className)) {
            return Object.getClassNamed(m.get(className));
        }

        return Object.getClassNamed(className);
    }

    /**
     * @description get the object for the given record
     * @param {Object} aRecord - the record to get the object for
     * @returns {Object}
     */
    objectForRecord (aRecord) { // private
        const className = aRecord.type;
        //console.log("loading " + className + " " + aRecord.id);
        if (className === "Promise") {
            console.warn(this.svType() + " WARNING: a Promise was stored. Returning a null. Check stack trace to see which object stored it.");
            return null;
        }

        const aClass = this.classForName(className);

        if (!aClass) {
            const error = "missing class '" + className + "' - returning null";
            console.warn(error);
            //throw new Error(error);

            return null;
        }
        assert(!Type.isNullOrUndefined(aRecord.id));

        if (Type.isUndefined(aClass.instanceFromRecordInStore)) {
            console.warn("Class '" + className + "' missing method 'instanceFromRecordInStore' - deserializing as null");
            return null;
        }

        let isSingleton = false;
        if (aClass.isSingleton !== undefined) {
            isSingleton = aClass.isSingleton();
        }
        //const wasAlreadyAllocated = isSingleton && (aClass._shared !== null && aClass._shared !== undefined);

        const obj = aClass.instanceFromRecordInStore(aRecord, this);
        if (obj === null) {
            // maybe the class shouldStore is false?
            return null;
        }

        // this assert may fail if the object is a singleton and was already allocated
        if (!isSingleton) {
            assert(!this.hasActiveObject(obj), "objectForRecord: object is already active in memory"); // if it's already active in memory, we shouldn't be asking for it's record to load it into memory
        }

        obj.setPuuid(aRecord.id);

        if (obj.shouldStore) {
            if (!obj.shouldStore()) {
                console.warn(this.logPrefix() + "WARNING: object " + obj.svType() + " loaded from store but has shouldStore=false. Not adding to activeObjects.");
            }
            this.addActiveObject(obj);
        }
        if (obj.puuid() === this.rootPid()) {
            this._rootObject = obj; // bit of a hack to make sure root ref is set before we load root contents
            // might want to split this method into one to get ref and another to load contents instead
        }
        obj.loadFromRecord(aRecord, this);

        this.loadingPids().delete(obj.puuid()); // need to do this to get object to ber marked as dirty if it's slots are updated in finalInit

        //assert(!obj._hasDoneInit); // if the class is a singleton, _hasDoneInit may already be true. Should init be called in that case?

        if (obj._hasDoneInit === false || obj._hasDoneInit === undefined) {
            if (obj.finalInit) {
                obj.finalInit();
            }

            if (obj.afterInit) {
                obj.afterInit(); // called didInit, which sets _hasDoneInit to true
            }
        }

        if (obj.afterUnserializeAndInit) {
            obj.afterUnserializeAndInit();
        }

        return obj;
    }

    /**
     * @description get the active object for the given pid
     * @param {String} puuid - the pid to get the active object for
     * @returns {Object}
     */
    activeObjectForPid (puuid) {
        return this.activeObjects().get(puuid);
    }

    checkValidAsyncPidValue (v) {
        if (typeof v === "string") {
            if (v.startsWith("_")) {
                return true;
            }
        }
        return false;
    }

    asyncObjectForPid (puuid) {
        assert(this.checkValidAsyncPidValue(puuid), "invalid async pid value: " + puuid);
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
            SvSyncScheduler.shared().scheduleTargetAndMethod(this, "didInitLoadingPids");
        }

        this.loadingPids().add(puuid);

        const aRecord = this.recordForPid(puuid);
        if (Type.isUndefined(aRecord)) {
            console.log(this.logPrefix() + "missing record for " + puuid);
            return undefined;
        }
        if (aRecord.type === "PersistentObjectPool") {
            console.log(this.logPrefix() + "skipping PersistentObjectPool record for " + puuid);
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
                    console.warn(this.logPrefix() + errorMsg);
                    //throw new Error(errorMsg)
                } else if (obj.didLoadFromStore) {
                    obj.didLoadFromStore(); // should this be able to trigger an objectForPid() that would add to loadingPids?
                }
            });
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
        const keySet = this.kvMap().keysSet();
        keySet.delete(this.headerKey());
        return keySet;
    }

    /**
     * @description get the all pids
     * @returns {Array}
     */
    allPids () {
        const keys = this.kvMap().keysArray();
        keys.remove(this.rootKey());
        return keys;
    }

    /*
    //activeLazyPids () { // returns a set of pids
        const pids = new Set();
        this.activeObjects().forEachKV((pid, obj) => {
            if (obj.lazyPids) {
                //obj.lazyPids(pids);
            }
        });
        return pids;
    }
    */

    // --- references ---

    /**
     * @description get the ref for the given pid
     * @param {String} aPid - the pid to get the ref for
     * @returns {Object}
     */
    refForPid (aPid) {
        // is this ever called?
        return {
            "*": aPid.pid()
            //"*": this.pid()
        };
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
            // literals will be inlined in the record
            return v;
        }

        if (Type.isBlob(v)) {
            // indexeddb will handle blob values in records natively, nice!
            // NOTES:
            // - idb doesn't deduplicate them
            // - idb doesn't load the blob value into memory until it's needed (e.g. async method blob.arrayBuffer() called)
            return v;
        }

        assert(!v.isClass(), "refValue called on a class: " + v.svType() + " and we can't serialize classes");

        if (!v.shouldStore()) {
            console.warn(this.logPrefix() + "WARNING: called refValue on " + v.svType() + " which has shouldStore=false");
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
        if (!this.kvMap().hasKey(puuid)) {
            return undefined;
        }
        const jsonString = this.kvMap().at(puuid);
        assert(Type.isString(jsonString));
        const aRecord = JSON.parse(jsonString);
        aRecord.id = puuid;
        return aRecord;
    }

    async asyncRecordForPid (puuid) {
        const data = await this.kvMap().asyncAt(puuid);
        if (typeof data === "string") {
            const aRecord = JSON.parse(data);
            aRecord.id = puuid;
            return aRecord;
        } else {
            const record = {};
            record.id = puuid;
            record.payload = data;
            return record;
        }
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
        let puuid = null;
        // use asyncPuuid if it exists (used for things like async computing a hash of a Blob)
        if (obj.asyncPuuid) {
            puuid = await obj.asyncPuuid();
        } else {
            puuid = obj.puuid();
        }
        return [puuid, jsonString];
    }

    /**
     * @description store the object
     * @param {Object} obj - the object to store
     * @returns {Object}
     */
    storeObject (obj) {
        /*
        if (Type.isDictionary(obj)) {
        }
        */

        // --- sanity checks ---
        assert(obj.shouldStore(), "object " + obj.svType() + " shouldStore is false");

        this.logDebug(() => "storeObject(" + obj.svTypeId() + ")");

        // --- store ---

        const puuid = obj.puuid();
        assert(!Type.isNullOrUndefined(puuid));

        if (obj === this.rootObject()) {
            this.setRootPid(puuid);
        }

        if (obj.asyncRecordForStore) {
            // asyncRecordForStore is only implemented if there's no
            // synchronous option for serialization e.g. serializing a Blob
            //throw new Error("no support for asyncRecordForStore yet!");
            const kvPromise = this.kvPromiseForObject(obj);
            this.kvMap().appendAsyncWriteKvPromise(kvPromise); // these will be awaited when committing the tx
        } else {
            //console.log(this.logPrefix() + "storeObject " + obj.svTypeId());

            const record = obj.recordForStore(this);
            const jsonString = JSON.stringify(record);
            //this.logDebug(() => "store " + puuid + " <- " + record.type )

            {
                // sanity checks
                // object should have a type and a class
                const recordType = record.type;
                assert(!Type.isNullOrUndefined(recordType), "object has no type property");

                const recordClass = SvGlobals.globals()[recordType];
                assert(recordClass && recordClass.isClass && recordClass.isClass(), "missing class for " + recordType);
            }


            this.kvMap().set(puuid, jsonString);
            //this.storeRecord(puuid, record);
        }
        return this;
    }

    /*
    storeRecord (puuid, record) {
        const jsonString = JSON.stringify(record);
        this.logDebug(() => "store " + puuid + " <- " + record.type );
        this.kvMap().set(puuid, jsonString);
        return this;
    }
    */

    // -------------------------------------

    /**
     * @description flush if needed
     * @returns {Object}
     */
    flushIfNeeded () {
        if (this.hasDirtyObjects()) {
            this.storeDirtyObjects();
            assert(!this.hasDirtyObjects());
        }
        return this;
    }

    /**
     * @async
     * @description promise collect
     * @returns {Number}
     */
    async promiseCollect () {
        //console.log(this.svType() + " --- promiseCollect ---");
        if (Type.isUndefined(this.rootPid())) {
            console.log(this.logPrefix() + "---- NO ROOT PID FOR COLLECT - clearing! ----");
            await this.kvMap().promiseBegin();
            this.kvMap().clear();
            await this.kvMap().promiseCommit();
            return 0;
        }

        // this is an on-disk collection
        // in-memory objects aren't considered
        // so we make sure they're flushed to the db first
        await this.kvMap().promiseBegin();
        this.flushIfNeeded(); // store any dirty objects

        this.logDebug(() => "--- begin collect --- with " + this.kvMap().count() + " pids");
        this.setMarkedSet(new Set());
        this.markedSet().add(this.rootKey()); // so rootKey->rootPid entry isn't swept (a special entry whose key is "rootKey" and value is the root pid)
        this.markPid(this.rootPid());

        /*
        // if we've already flushed the dirty objects, we don't need to mark the active objects
        //this.activeObjects().forEachK(pid => this.markPid(pid));  // needed? isn't this an on disk collection?
        //this.activeLazyPids().forEachK(pid => this.markPid(pid)); // needed? isn't this an on disk collection?
        */
        const deleteCount = this.sweep();
        this.setMarkedSet(null);

        this.logDebug(() => "--- end collect --- collecting " + deleteCount + " pids ---");
        //console.log(this.logPrefix() + "         --- end collect --- collecting " + deleteCount + " pids ---");

        await this.kvMap().promiseCommit();

        const remainingCount = this.kvMap().count();
        this.logDebug(() => " ---- keys count after commit: " + remainingCount + " ---");
        return remainingCount;
    }

    /**
     * @description mark the pid
     * @param {String} pid - the pid to mark
     * @returns {Boolean}
     */
    markPid (pid) { // private
        // TODO: rewrite to not use recursion in order to avoid stack depth limit
        //this.logDebug(() => "markPid(" + pid + ")")
        if (!this.markedSet().has(pid)) {
            this.markedSet().add(pid);
            const refPids = this.refSetForPuuid(pid);
            refPids.forEach(refPid => this.markPid(refPid));
            return true;
        }
        return false;
    }

    /**
     * @description get the ref set for the given puuid
     * @param {String} puuid - the puuid to get the ref set for
     * @returns {Set}
     */
    refSetForPuuid (puuid) {
        const record = this.recordForPid(puuid);
        const puuids = new Set();

        if (record) {
            Object.keys(record).forEach(k => this.puuidsSetFromJson(record[k], puuids));
        }

        return puuids;
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

        //console.log(this.logPrefix() + " json: ", JSON.stringify(json, null, 2));

        if (Type.isLiteral(json)) {
            // we could call refsPidsForJsonStore but none will add any pids,
            // and null raises exception, so we can just skip it for now
        } else if (Type.isObject(json) && json.refsPidsForJsonStore) {
            json.refsPidsForJsonStore(puuids);
        } else {
            throw new Error("unable to handle json type: " + typeof(json) + " missing refsPidsForJsonStore() method?");
        }

        return puuids;
    }

    objectSetReferencingPid (pid) {
        const objects = new Set();
        this.kvMap().keysSet().forEach(objPid => {
            const obj = this.objectForPid(objPid);
            if (obj.refSetForPuuid(pid).has(objPid)) {
                objects.add(obj);
            }
        });
        return objects;
    }

    // ------------------------


    /**
     * @description Sweep unmarked pids. Called after marking is complete. Part of garbage collection.
     * @returns {Number} The number of pids swept.
     */
    sweep () {
        const unmarkedPidSet = this.allPidsSet().difference(this.markedSet()); // allPids doesn't contain rootKey
        const kvMap = this.kvMap();

        unmarkedPidSet.forEach(pid => {
            //this.logDebug(() => "--- sweeping --- deletePid(" + pid + ") ");
            this.onCollectPid(pid);
            kvMap.removeKey(pid); // this will remove the pid from the kvMap
        });

        return unmarkedPidSet.count();
    }

    onCollectPid (pid) {
        // give the class a chance to do something before the pid is collected
        const record = this.recordForPid(pid);
        const aClass = this.classForName(record.type);
        if (aClass && aClass.willCollectRecord) {
            const collectMethod = aClass.willCollectRecord(record);
            if (collectMethod) {
                collectMethod.apply(aClass, [record]);
            }
        }
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
        const map = this.kvMap();
        await map.promiseBegin();
        map.forEachK(pid => {
            map.removeKey(pid);
        }); // the remove applies to the changeSet
        await map.promiseCommit();
    }

    /**
     * @description promise clear
     * @returns {void}
     */
    promiseClear () {
        return this.kvMap().promiseClear();
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
        return this.kvMap().count();
    }

    /**
     * @description total bytes
     * @returns {Number}
     */
    totalBytes () {
        return this.kvMap().totalBytes();
    }

    // ---------------------------

    /*
    activeObjectsReferencingObject (anObject) {
        // useful for seeing if we can unload an object
        // BUT, to do full collect, do a mark/sweep on active objects
        // where sweep only removes unmarked from activeObjects and records cache?

        assert(this.hasActiveObject(anObject)) ;

        const referencers = new Set();
        const pid = anObject.puuid();

        this.activeObjects().forEachKV((pid, obj) => {
            const refPids = this.refSetForPuuid(obj.puuid())
            if (refPids.has(pid)) {
                referencers.add(obj);
            }
        });

        return referencers;
    }
    */

    /*
    static selfTestRoot () {
        const aTypedArray = Float64Array.from([1.2, 3.4, 4.5]);
        const aSet = new Set("sv1", "sv2");
        const aMap = new Map([ ["mk1", "mv1"], ["mk2", "mv2"] ]);
        const aNode = SvStorableNode.clone();
        const a = [1, 2, [3, null], { foo: "bar", b: true }, aSet, aMap, new Date(), aTypedArray, aNode];
        return a;
    }

    static selfTest () {
        console.log(this.svType() + " --- self test start --- ");
        const store = ObjectPool.clone()
        store.open();;

        store.rootOrIfAbsentFromClosure(() => SvStorableNode.clone());
        store.flushIfNeeded();
        console.log("store:", store.asJson());
        console.log(" --- ");
        store.promiseCollect();
        store.clearCache();
        const loadedNode = store.rootObject();
        console.log("loadedNode = ", loadedNode);
        console.log(this.svType() + " --- self test end --- ");
    }
    */

    // --- blobs ---

    /**
     * @async
     * @description collect blobs
     * @returns {Promise<number>}
     */
    async asyncCollectBlobs () {
        const keySet = this.allBlobHashesSet();
        const removedCount = await SvBlobPool.shared().asyncCollectUnreferencedKeySet(keySet);
        return removedCount;
    }


    /**
     * @description get all objects
     * @returns {Set}
     */
    allObjects () {
        const objects = new Set();
        this.kvMap().keysSet().forEach(pid => {
            const obj = this.objectForPid(pid);
            objects.add(obj);
        });
        return objects;
    }

    /*
    allRecords () {
        const records = new Set();
        this.kvMap().keysSet().forEach(pid => {
            const record = this.recordForPid(pid);
            records.add(record);
        });
        return records;
    }
    */

    allBlobHashesSet () {
        const hashesSet = new Set();
        this.allObjects().forEach(obj => {
            if (obj.storeBlobHashesSet) {
                const objBlobHashes = obj.storeBlobHashesSet();
                hashesSet.addAll(objBlobHashes);
            }
        });

        return hashesSet;
    }


}.initThisClass());

