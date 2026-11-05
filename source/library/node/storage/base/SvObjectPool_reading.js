"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool_reading
 * @extends SvObjectPool
 * @classdesc Reading: from a record to a live object — class lookup (with renames and
 * replica classes), the identity map of loaded objects, references between
 * records (refs, far refs to child pools) and their resolution, and the
 * missing-class report. A category of SvObjectPool, split from SvObjectPool.js
 * unchanged (Plans/Cleanup § 3).
 */
(class SvObjectPool_reading extends SvObjectPool {

    // --- reading ---

    /**
     * @description The className conversion map, SHARED BY EVERY POOL.
     *
     * A rename is a fact about the codebase's history, not a property of one
     * pool, so there is exactly one map and it does not matter which pool an
     * app registers renames on.
     *
     * It was per-instance, and the app registers renames on the shared
     * persistent pool only — so every SvSubObjectPool (cloud nodes, sessions)
     * resolved class names against an EMPTY map. A renamed class then loaded
     * fine from the local store and came back `null` from a cloud record, whose
     * nulls are then "repaired" out of the subnodes array: silent data loss on
     * the cloud path, once per boot. The JSON layer already got this right
     * (SvJsonIdNode.jsonTypeRenameMap is static), which is exactly why cloud
     * JSON followed renames while cloud RECORDS did not.
     *
     * Deliberately keyed off SvObjectPool itself rather than `this` — a static
     * touched through a subclass would give each subclass its own map and
     * reintroduce the same bug one level up.
     * @returns {Map}
     */
    classNameConversionMap () {
        return SvObjectPool.sharedClassNameConversionMap();
    }

    /**
     * @description The one conversion map. See classNameConversionMap().
     * @returns {Map}
     */
    static sharedClassNameConversionMap () {
        if (!SvObjectPool._classNameConversionMap) {
            SvObjectPool._classNameConversionMap = new Map();
        }
        return SvObjectPool._classNameConversionMap;
    }

    /**
     * @description Class-side registration, so renames can be declared before
     * (or without) any pool existing.
     * @param {String} oldName
     * @param {String} newName
     * @returns {Class}
     */
    static addClassNameConversion (oldName, newName) {
        this.sharedClassNameConversionMap().set(oldName, newName);
        if (typeof SvJsonIdNode !== "undefined" && SvJsonIdNode.addJsonTypeRename) {
            SvJsonIdNode.addJsonTypeRename(oldName, newName); // keep the JSON layer in step
        }
        return this;
    }

    /**
     * @description Adds a class name conversion to the map.
     * Used when a class has been renamed and stored records reference the old name.
     * @param {String} oldName - The old class name
     * @param {String} newName - The new class name
     * @returns {SvObjectPool}
     */
    addClassNameConversion (oldName, newName) {
        this.classNameConversionMap().set(oldName, newName);
        // Mirror into the JSON layer: record loading and JSON deserialization
        // both have to follow renames, and ClassRenames.json should be the only
        // place a rename is declared. Without this, a renamed class loaded fine
        // from the store and resolved to null from a cloud/catalog document.
        if (typeof SvJsonIdNode !== "undefined" && SvJsonIdNode.addJsonTypeRename) {
            SvJsonIdNode.addJsonTypeRename(oldName, newName);
        }
        return this;
    }

    addClassNameConversionTuples (conversionTuples) {
        conversionTuples.forEach((conversionTuple) => {
            this.addClassNameConversion(conversionTuple[0], conversionTuple[1]);
        });
        return this;
    }

    /**
     * @description get the class for the given name
     * @param {String} className - the name of the class
     * @returns {Class}
     */
    /**
     * @description The class a record of aClass loads as here: its replica
     * class in a replica pool (a hosted document's host and replica run
     * different behavior over the same stored state), else itself.
     * @param {Class|null} aClass
     * @returns {Class|null}
     * @category Loading
     */
    loadClassFor (aClass) {
        return (aClass && this.isReplica() && aClass.replicaClass) ? aClass.replicaClass() : aClass;
    }

    classForName (className) {
        const m = this.classNameConversionMap();
        if (m.has(className)) {
            const newName = m.get(className);
            return Object.getClassNamed(newName);
        }
        return Object.getClassNamed(className);
    }

    /**
     * @description A record whose class can't be loaded (renamed or removed
     * with no conversion for this pool) loads as null, so its parent's list in
     * memory is short by it. Nothing is lost until that list is next edited:
     * the rewrite drops the entry, collection deletes it and its subtree, and
     * the next cloud commit deletes them at the current version (shown
     * headlessly 2026-11-04; Cleanup § 4). Sent as an error report, once per
     * class name per process, to learn whether any stored data is in this
     * state before deciding on a fix.
     * @param {String} className
     * @category Loading
     */
    reportMissingClass (className) {
        const message = "missing class '" + className + "' - loading its record as null (pool " + this.poolId() + ")";
        console.warn(this.logPrefix() + message);
        if (SvObjectPool.isFirstMissingClassReport(className) && SvGlobals.has("SvErrorReport")) {
            SvErrorReport.asyncSend(new Error(message), { kind: "missing-class", className: className, poolId: this.poolId(), rootType: this.rootObject() ? this.rootObject().svType() : null });
        }
        return this;
    }

    static isFirstMissingClassReport (className) {
        if (!this._reportedMissingClassNames) {
            this._reportedMissingClassNames = new Set();
        }
        const isFirst = !this._reportedMissingClassNames.has(className);
        this._reportedMissingClassNames.add(className);
        return isFirst;
    }

    /**
     * @description get the object for the given record
     * @param {Object} aRecord - the record to get the object for
     * @returns {Object}
     */
    objectForRecord (aRecord) { // private
        const className = aRecord.type;
        if (className === "Promise") {
            console.warn(this.svType() + " WARNING: a Promise was stored. Returning a null. Check stack trace to see which object stored it.");
            return null;
        }

        const aClass = this.loadClassFor(this.classForName(className));

        if (!aClass) {
            this.reportMissingClass(className);
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

        // Breadcrumb for dangling-reference diagnostics: while this record
        // loads, any "missing record for <pid>" it triggers (resolving its
        // refs) can name WHO holds the dangling reference — without it the
        // missing-record log is untraceable (reported: hundreds of missing
        // records with no way to find the referrer).
        if (!this._loadingRecordStack) { this._loadingRecordStack = []; }
        this._loadingRecordStack.push(aRecord.type + ":" + aRecord.id);
        let obj;
        try {
            obj = aClass.instanceFromRecordInStore(aRecord, this);
        } finally {
            this._loadingRecordStack.pop();
        }
        if (obj) {
            SvTransactionContext.noteLoaded(obj); // loaded, not allocated: a rollback never retires it
        }
        if (obj === null) {
            // maybe the class shouldStore is false?
            return null;
        }

        // this assert may fail if the object is a singleton and was already allocated
        if (!isSingleton) {
            assert(!this.hasActiveObject(obj), "objectForRecord: object is already active in memory"); // if it's already active in memory, we shouldn't be asking for it's record to load it into memory
        }

        /*
        if (isSingleton && obj.hasPuuid() && obj.puuid() !== aRecord.id) {
            console.log(this.logPrefix() + " changing singleton object " + obj.svDebugId() + " pid from " + obj.puuid() + " to " + aRecord.id);
        }
        */
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

        if (isSingleton || obj._hasDoneInit === false || obj._hasDoneInit === undefined) {
            if (obj.finalInit) {
                obj.finalInit();  // this might be called again if the object is a singleton
            }

            if (obj.afterInit) {
                obj.afterInit(); // calls didInit, which sets _hasDoneInit to true
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
    objectForPid (puuid) { // PRIVATE (except also used by SvStoreRef)
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
            const referrer = (this._loadingRecordStack && this._loadingRecordStack.length > 0)
                ? this._loadingRecordStack[this._loadingRecordStack.length - 1]
                : "(not during a record load)";
            if (this.shouldReportMissingPid(puuid)) {
                console.log(this.logPrefix() + "missing record for " + puuid + " — referenced while loading " + referrer);
            }
            return undefined;
        }
        if (aRecord.type === "SvPersistentObjectPool") {
            console.log(this.logPrefix() + "skipping SvPersistentObjectPool record for " + puuid);
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
                    if (this.shouldReportMissingPid(loadedPid)) {
                        console.warn(this.logPrefix() + "missing activeObjectForPid " + loadedPid);
                    }
                    //throw new Error(errorMsg)
                } else if (obj.didLoadFromStore) {
                    obj.didLoadFromStore(); // should this be able to trigger an objectForPid() that would add to loadingPids?
                }
            });
        }
        this.setIsFinalizing(false);
    }

    //

    allPidsSet () {
        return new Set(this.allPids());
    }

    allPids () {
        if (!this.poolId()) {
            return [];
        }
        return this.recordStore().rowsForPool(this.poolId()).filter(row => !row.isDeleted).map(row => row.objectId);
    }

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
        const farPoolId = v.getOwnProperty("**");
        if (farPoolId) {
            return this.farObjectForPoolId(farPoolId);
        }
        const puuid = v.getOwnProperty("*");
        assert(puuid);
        const obj = this.objectForPid(puuid);
        return obj;
    }

    /**
     * @description Resolves a far ref { "**": poolId }: the root of that pool,
     * opened from the same record store when its rows are local (synchronous —
     * the store's map is in memory), undefined when the pool is not here.
     * @category References
     */
    farObjectForPoolId (poolId) {
        const pool = this.recordStore().poolForId(poolId);
        if (!pool) {
            if (this.shouldReportMissingPid(poolId)) {
                console.log(this.logPrefix() + "far ref to pool " + poolId + " which is not in the local store");
            }
            return undefined;
        }
        return pool.rootObject() || pool.readRootObject();
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

        if (this.isFarObject(v)) {
            this.ensureChildPoolForRoot(v);
            return { "**": v.puuid() };
        }
        if (!this.hasActiveObject(v)) {
            this.addActiveObject(v);
            this.addDirtyObject(v);
        } else {
            this.warnIfRefWillDangle(v);
        }
        const ref = { "*": v.puuid() };
        return ref;
    }

    /**
     * @description An element of a windowed collection is placed under its
     * collection node with an order key between its stored neighbours' keys; a
     * key, once assigned, is kept. Any other record has no placement.
     * @category Storing
     */
    placementForWindowedElement (obj, existing) {
        const parent = (obj && obj.parentNode) ? obj.parentNode() : null;
        if (!parent || !parent.subnodesAreWindowed || !parent.subnodesAreWindowed()) {
            return { parentId: null, orderKey: null };
        }
        if (existing && existing.parentId === parent.puuid() && existing.orderKey) {
            return { parentId: existing.parentId, orderKey: existing.orderKey };
        }
        const key = this.pendingPlacementsFor(parent).get(obj.puuid()) || SvOrderKey.keyBetween(null, null);
        return { parentId: parent.puuid(), orderKey: key };
    }

    /**
     * @description Keys for every not-yet-placed element of a windowed node,
     * computed in one pass over its loaded elements (each between the nearest
     * placed neighbours) the first time the store pass needs one — a
     * 5,000-message append is O(n), not a walk per element. Cleared with the pass.
     * @category Storing
     */
    pendingPlacementsFor (parent) {
        if (!this._pendingPlacements) {
            this._pendingPlacements = new Map();
        }
        if (this._pendingPlacements.has(parent)) {
            return this._pendingPlacements.get(parent);
        }
        const stored = this.recordStore().orderKeysForNode(this.poolId(), parent.puuid()); // pid → orderKey
        const siblings = parent._subnodes || [];
        const nextStoredKey = new Array(siblings.length).fill(null);
        let upcoming = null;
        for (let i = siblings.length - 1; i >= 0; i--) {
            nextStoredKey[i] = upcoming;
            const key = stored.get(siblings[i].puuid());
            if (key) { upcoming = key; }
        }
        // The array is the truth of the order. A stored key that does not
        // follow the previous element's key (the collection was re-sorted, or
        // an earlier build placed elements out of order) is re-keyed like an
        // unplaced element, and its row is rewritten in this batch — never an
        // assertion in the store pass, which would lose the save.
        const pending = new Map();
        let previous = null;
        siblings.forEach((sibling, i) => {
            const key = stored.get(sibling.puuid());
            if (key && (previous === null || key > previous)) {
                previous = key;
                return;
            }
            let upper = nextStoredKey[i];
            if (upper !== null && previous !== null && upper <= previous) {
                upper = this.firstStoredKeyAfter(siblings, i, stored, previous); // rare: the misordered case
            }
            const assigned = SvOrderKey.keyBetween(previous, upper);
            pending.set(sibling.puuid(), assigned);
            if (key) {
                this.rekeyPlacedRow(sibling.puuid(), assigned);
            }
            previous = assigned;
        });
        this._pendingPlacements.set(parent, pending);
        return pending;
    }

    firstStoredKeyAfter (siblings, index, stored, previous) {
        for (let j = index + 1; j < siblings.length; j++) {
            const key = stored.get(siblings[j].puuid());
            if (key && key > previous) {
                return key;
            }
        }
        return null;
    }

    /**
     * @description Rewrites an already-placed element's row with a new order key
     * (inside the store pass's batch), so the store's order follows the array's.
     * @category Storing
     */
    rekeyPlacedRow (pid, orderKey) {
        const store = this.recordStore();
        const row = store.rowForKey(this.poolId(), pid);
        if (row) {
            row.orderKey = orderKey;
            store.putRowInBatch(row);
        }
        return this;
    }

    orderKeyForPid (pid) {
        const row = this.rowForPid(pid);
        return (row && row.orderKey) ? row.orderKey : null;
    }

    /**
     * @description Elements attached to a windowed node before it had a pool join
     * the pool when the node is stored (the node's record holds no ref to them).
     * @category Storing
     */
    enrollWindowedElementsOf (node) {
        const elements = node._subnodes || [];
        elements.forEach((element) => {
            if (element && element.shouldStore && element.shouldStore() && !this.hasActiveObject(element)) {
                this.addActiveObject(element);
                this.addDirtyObject(element);
            }
        });
        return this;
    }

}.initThisCategory());
