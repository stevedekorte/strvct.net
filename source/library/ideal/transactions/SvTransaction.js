"use strict";

/**
 * @module library.ideal.transactions
 * @class SvTransaction
 * @extends ProtoClass
 * @classdesc Rollback of in-memory state by first-touch snapshots
 * (Plans/Client Transactions, M1: synchronous, one pool). The first time an
 * object or collection changes inside the transaction its complete
 * pre-transaction state is captured — every declared slot read raw, a shallow
 * copy of a collection; later changes to it are ignored beyond "already
 * captured?". Commit keeps the live state and drops the captures. Rollback
 * writes the captures back through raw, unhooked paths, retires the objects
 * allocated inside, un-enrolls the ones that joined the pool, cancels the work
 * they and the touched objects queued (scheduler actions, notes, timers),
 * restores the pool's dirty set, and posts one notification-only view
 * invalidation for the touched nodes.
 */
(class SvTransaction extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("pool", null);
            slot.setSlotType("SvObjectPool");
        }
        {
            const slot = this.newSlot("objectSnapshots", null);
            slot.setSlotType("Map");
            slot.setDescription("object → Map(slot → raw value), captured on first touch");
        }
        {
            const slot = this.newSlot("collectionSnapshots", null);
            slot.setSlotType("Map");
            slot.setDescription("collection → shallow copy, captured on first willMutate");
        }
        {
            const slot = this.newSlot("allocatedObjects", null);
            slot.setSlotType("Set");
            slot.setDescription("SvNode kinds cloned during the transaction; retired on rollback");
        }
        {
            const slot = this.newSlot("loadedObjects", null);
            slot.setSlotType("Set");
            slot.setDescription("objects materialized from records during the transaction; never retired");
        }
        {
            const slot = this.newSlot("createdObjects", null);
            slot.setSlotType("Set");
            slot.setDescription("objects enrolled in the pool during the transaction; un-enrolled on rollback");
        }
        {
            const slot = this.newSlot("dirtyBefore", null);
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("taggedActions", null);
            slot.setSlotType("Set");
        }
        {
            const slot = this.newSlot("taggedNotes", null);
            slot.setSlotType("Set");
        }
        {
            const slot = this.newSlot("taggedTimeouts", null);
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("isRollbackOnly", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isRestoring", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("wasStoreDeferred", false);
            slot.setSlotType("Boolean");
            slot.setDescription("a store pass came due while open; commit schedules it");
        }
    }

    init () {
        super.init();
        this.setObjectSnapshots(new Map());
        this.setCollectionSnapshots(new Map());
        this.setAllocatedObjects(new Set());
        this.setLoadedObjects(new Set());
        this.setCreatedObjects(new Set());
        this.setTaggedActions(new Set());
        this.setTaggedNotes(new Set());
        this.setTaggedTimeouts([]);
        return this;
    }

    begin () {
        this.setDirtyBefore(new Map(this.pool().dirtyObjects()));
        return this;
    }

    // --- capture ---

    /**
     * @description First-touch capture of every declared, transactional slot,
     * read raw (a lazy slot's ref stays a ref). An object of another pool is a
     * design error: it poisons the transaction and throws.
     * @category Capture
     */
    snapshotObject (anObject) {
        if (this.objectSnapshots().has(anObject) || this.allocatedObjects().has(anObject)) {
            return this;
        }
        this.assertObjectBelongs(anObject);
        const slots = new Map();
        const allSlots = anObject.thisPrototype ? anObject.thisPrototype().allSlotsMap() : null;
        if (allSlots) {
            allSlots.forEachKV((name, slot) => {
                if (slot.isTransactional()) {
                    slots.set(slot, this.rawValueOfSlot(anObject, slot));
                }
            });
        }
        this.objectSnapshots().set(anObject, slots);
        return this;
    }

    assertObjectBelongs (anObject) {
        const registry = SvGlobals.get("SvObjectPool");
        const own = registry ? registry.poolOfObject(anObject) : null;
        if (own && own !== this.pool()) {
            this.setIsRollbackOnly(true);
            throw new Error("transaction on pool " + this.pool().poolId() + " touched " + anObject.svTypeId() + " of pool " + own.poolId());
        }
    }

    rawValueOfSlot (anObject, slot) {
        return slot.isWeak() ? anObject.baseGetSlotValue(slot) : slot.onInstanceRawGetValue(anObject);
    }

    snapshotCollection (aCollection) {
        if (this.collectionSnapshots().has(aCollection)) {
            return this;
        }
        this.collectionSnapshots().set(aCollection, this.shallowCopyOf(aCollection));
        return this;
    }

    shallowCopyOf (aCollection) {
        if (Type.isArray(aCollection)) {
            return aCollection.slice();
        }
        if (Type.isMap(aCollection)) {
            return new Map(aCollection);
        }
        if (Type.isSet(aCollection)) {
            return new Set(aCollection);
        }
        throw new Error("cannot snapshot a " + Type.typeName(aCollection));
    }

    // --- outcome ---

    commit () {
        this.objectSnapshots().clear();
        this.collectionSnapshots().clear();
        this.allocatedObjects().clear();
        this.createdObjects().clear();
        this.taggedActions().clear();
        this.taggedNotes().clear();
        this.setTaggedTimeouts([]);
        if (this.wasStoreDeferred() || this.pool().hasDirtyObjects()) {
            this.pool().scheduleStore();
        }
        return this;
    }

    rollback () {
        this.setIsRestoring(true);
        try {
            this.restoreObjects();
            this.restoreCollections();
            this.retireAllocatedObjects();
            this.unenrollCreatedObjects();
            this.cancelTaggedWork();
            this.pool().setDirtyObjects(new Map(this.dirtyBefore()));
        } finally {
            this.setIsRestoring(false);
        }
        this.invalidateTouchedNodes();
        return this;
    }

    restoreObjects () {
        this.objectSnapshots().forEach((slots, anObject) => {
            slots.forEach((value, slot) => {
                if (slot.isWeak()) {
                    anObject.baseSetSlotValue(slot, value);
                } else {
                    slot.onInstanceRawSetValue(anObject, value);
                }
            });
        });
    }

    restoreCollections () {
        this.collectionSnapshots().forEach((copy, aCollection) => {
            if (Type.isArray(aCollection)) {
                this.restoreArray(aCollection, copy);
            } else if (Type.isMap(aCollection)) {
                aCollection.unhooked_clear();
                copy.forEach((v, k) => aCollection.unhooked_set(k, v));
            } else if (Type.isSet(aCollection)) {
                aCollection.unhooked_clear();
                copy.forEach(v => aCollection.unhooked_add(v));
            }
        });
    }

    restoreArray (anArray, copy) {
        anArray.unhooked_splice(0, anArray.length, ...copy); // the copy was in order when captured; no resort, no didMutate
        if (anArray.setNeedsReindex) {
            anArray.setNeedsReindex(true);
        }
    }

    /**
     * @description Objects cloned inside the transaction never happened: their
     * observations and scheduled actions go through the retirement primitives
     * (never an application override), and any pool they joined forgets them.
     * @category Rollback
     */
    retireAllocatedObjects () {
        this.allocatedObjects().forEach((anObject) => {
            if (this.loadedObjects().has(anObject)) {
                return;
            }
            if (anObject.removeAllNotificationObservations) {
                anObject.removeAllNotificationObservations();
            }
            if (anObject.removeScheduledActions) {
                anObject.removeScheduledActions();
            }
            this.unenrollObject(anObject);
        });
    }

    unenrollCreatedObjects () {
        this.createdObjects().forEach((anObject) => {
            if (!this.loadedObjects().has(anObject)) {
                this.unenrollObject(anObject);
            }
        });
    }

    unenrollObject (anObject) {
        const registry = SvGlobals.get("SvObjectPool");
        const pool = registry ? registry.poolOfObject(anObject) : null;
        if (!pool || !anObject.hasPuuid || !anObject.hasPuuid()) {
            return;
        }
        pool.activeObjects().delete(anObject.puuid());
        pool.dirtyObjects().delete(anObject.puuid());
        if (anObject.removeMutationObserver) {
            anObject.removeMutationObserver(pool);
        }
        registry.objectPoolRegistry().delete(anObject);
    }

    cancelTaggedWork () {
        if (SvGlobals.has("SvSyncScheduler")) {
            const scheduler = SvSyncScheduler.shared();
            this.taggedActions().forEach((action) => {
                if (scheduler.actions().at(action.actionsKey()) === action) {
                    scheduler.removeActionKey(action.actionsKey());
                }
            });
        }
        if (SvGlobals.has("SvNotificationCenter")) {
            SvNotificationCenter.shared().removeQueuedNotes(this.taggedNotes());
        }
        this.taggedTimeouts().forEach(([owner, tid]) => {
            if (owner.clearTimeout) {
                owner.clearTimeout(tid);
            }
        });
    }

    /**
     * @description Views observe the nodes they show; after a restore they must
     * re-read. Notification only — never didUpdateNode(), whose walk to the
     * parent runs application overrides that would re-dirty the restored graph.
     * @category Rollback
     */
    invalidateTouchedNodes () {
        const posted = new Set();
        const postFor = (node) => {
            let current = node;
            while (current && !posted.has(current)) {
                posted.add(current);
                if (current.hasDoneInit && current.hasDoneInit() && current.didUpdateNodeNote) {
                    const note = current.didUpdateNodeNote();
                    if (note) {
                        note.post();
                    }
                }
                current = current.parentNode ? current.parentNode() : null;
            }
        };
        this.objectSnapshots().forEach((slots, anObject) => postFor(anObject));
        this.collectionSnapshots().forEach((copy, aCollection) => {
            const owner = aCollection.owner ? aCollection.owner() : null;
            if (owner) {
                postFor(owner);
            }
        });
        this.objectSnapshots().clear();
        this.collectionSnapshots().clear();
    }

}.initThisClass());
