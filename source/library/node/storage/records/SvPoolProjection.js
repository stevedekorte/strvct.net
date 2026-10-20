"use strict";

/**
 * @module library.node.storage.records
 */

/**
 * @class SvPoolProjection
 * @extends ProtoClass
 * @classdesc The projection of an object pool: the part of a hosted document
 * its replicas may read, committed to a second cloud pool alongside the truth
 * (Plans/Server-Hosted Sessions, M1a).
 *
 * What replicas may see is an allow-list, the same one the "Cloud" JSON view
 * uses (`cloudJsonSchemaSlots()`: slots marked isInCloudJson): a record keeps
 * only those slots (and its subnodes, for a class that stores them), less any
 * host-only slot (`slot.setIsHostOnly(true)` — cloud state the host keeps from
 * its players, like a GM's secrets) and any slot the class's replicaClass()
 * has no slot for (what a replica could not hold). The projection holds exactly the records
 * reachable from the root through what is kept; a record whose class is
 * host-only (`static isHostOnly()`), or that is not a node at all, is left out
 * with everything reachable only through it, and a reference to a left-out
 * record is cut (null in a slot, removed from an array). A stored slot nobody
 * marked for players therefore never reaches them. Object ids are the truth's,
 * so references line up.
 *
 * Each commit sends what changed since the last projected state (its own
 * snapshot: payload and placement per record), as writes and deletes for the
 * projection pool. Records are re-projected only when their payload changed —
 * each one's projected form and outgoing references are cached against its
 * source payload — so a commit's walk costs set operations, not a parse of the
 * whole pool.
 */
(class SvPoolProjection extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("pool", null);
            slot.setSlotType("SvObjectPool");
            slot.setDescription("the truth pool this projects");
        }
        {
            const slot = this.newSlot("cloudPoolId", null);
            slot.setSlotType("String");
            slot.setDescription("the projection's pool id in the cloud — the replicas' scope and the truth's local id");
        }
        {
            const slot = this.newSlot("version", 0);
            slot.setSlotType("Number");
            slot.setDescription("the projection pool's cloud version: the base of its next commit");
        }
        {
            const slot = this.newSlot("create", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
            slot.setDescription("{ scopeId } for the projection's first commit");
        }
        {
            const slot = this.newSlot("lastSnapshot", null);
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
            slot.setDescription("pid → signature (payload and placement) of what the cloud projection holds; null when unknown");
        }
        {
            const slot = this.newSlot("entryCache", null);
            slot.setSlotType("Map");
            slot.setFinalInitProto(Map);
            slot.setDescription("pid → { source, projected, refs }: a record's projection, valid while its payload is unchanged");
        }
    }

    initPrototype () {
    }

    // --- what the projection holds ---

    /**
     * @description The projected records now: pid → { payloadJson, parentId, orderKey },
     * walking from the root through refs and windowed placements, stopping at
     * host-only records.
     * @returns {Map}
     * @category Projecting
     */
    projectedRecords () {
        const sources = this.sourceRecords();
        const children = this.windowedChildrenByParent();
        const projected = new Map();
        const pending = [this.pool().rootPid()];
        while (pending.length > 0) {
            const pid = pending.pop();
            if (projected.has(pid) || !sources.has(pid)) {
                continue;
            }
            const entry = this.entryFor(pid, sources);
            if (entry.projected === null) {
                continue; // host-only: neither it nor what only it reaches
            }
            projected.set(pid, this.projectedRow(pid, entry.projected));
            entry.refs.forEach(ref => pending.push(ref));
            (children.get(pid) || []).forEach(child => pending.push(child));
        }
        return projected;
    }

    sourceRecords () {
        const sources = new Map();
        this.pool().forEachRecordJson((pid, jsonString) => sources.set(pid, jsonString));
        return sources;
    }

    /**
     * @description Windowed elements, which no record references: parentId → [pid].
     * @returns {Map}
     * @category Projecting
     */
    windowedChildrenByParent () {
        const children = new Map();
        const pool = this.pool();
        pool.recordStore().rowsForPool(pool.poolId()).forEach((row) => {
            if (row.parentId && !row.isDeleted && row.objectId !== pool.rootPid()) {
                if (!children.has(row.parentId)) {
                    children.set(row.parentId, []);
                }
                children.get(row.parentId).push(row.objectId);
            }
        });
        return children;
    }

    projectedRow (pid, payloadJson) {
        const projectedRow = { payloadJson: payloadJson, parentId: null, orderKey: null };
        const row = pid === this.pool().rootPid() ? null : this.pool().rowForPid(pid); // the projection's root is unplaced
        if (row && row.parentId) {
            projectedRow.parentId = row.parentId;
            projectedRow.orderKey = row.orderKey;
        }
        return projectedRow;
    }

    // --- one record ---

    /**
     * @description A record's projection, from the cache while its payload is unchanged.
     * @returns {Object} { source, projected: String|null (null = host-only), refs: Array<pid> }
     * @category Projecting
     */
    entryFor (pid, sources) {
        const source = sources.get(pid);
        const cached = this.entryCache().get(pid);
        if (cached && cached.source === source) {
            return cached;
        }
        const entry = this.newEntry(source, sources);
        this.entryCache().set(pid, entry);
        return entry;
    }

    newEntry (source, sources) {
        const record = JSON.parse(source);
        if (this.isHostOnlyType(record.type)) {
            return { source: source, projected: null, refs: [] };
        }
        if (Array.isArray(record.entries)) {
            const kept = this.keptSlotNamesForType(record.type);
            if (kept === null) {
                return { source: source, projected: null, refs: [] }; // not a node: nothing of it is marked for players
            }
            record.entries = record.entries.filter(entry => kept.has(entry[0]));
        }
        const refs = [];
        const projected = this.cutHostOnlyRefs(record, sources, refs);
        return { source: source, projected: JSON.stringify(projected), refs: refs };
    }

    /**
     * @description A copy of a record's JSON with references to host-only
     * records cut — null in place, removed from arrays — collecting the refs
     * that remain. A ref is `{ "*": pid }`; a far ref (`{ "**": poolId }`)
     * names another pool and is kept.
     * @returns {*}
     * @category Projecting
     */
    cutHostOnlyRefs (json, sources, refs) {
        if (Array.isArray(json)) {
            return json.filter(v => !this.isHostOnlyRef(v, sources)).map(v => this.cutHostOnlyRefs(v, sources, refs));
        }
        if (json === null || typeof json !== "object") {
            return json;
        }
        if (this.isRef(json)) {
            if (this.isHostOnlyRef(json, sources)) {
                return null;
            }
            refs.push(json["*"]);
            return json;
        }
        const copy = {};
        Object.keys(json).forEach((k) => { copy[k] = this.cutHostOnlyRefs(json[k], sources, refs); });
        return copy;
    }

    isRef (json) {
        return json !== null && typeof json === "object" && !Array.isArray(json) && typeof json["*"] === "string" && Object.keys(json).length === 1;
    }

    isHostOnlyRef (json, sources) {
        if (!this.isRef(json)) {
            return false;
        }
        const target = sources.get(json["*"]);
        return !!target && this.isHostOnlyType(this.typeOfSource(target));
    }

    typeOfSource (source) {
        const match = source.match(/^\{"type":"([^"]+)"/); // records serialize their type first
        return match ? match[1] : JSON.parse(source).type;
    }

    // --- classes and slots ---

    isHostOnlyType (type) {
        const aClass = type ? this.pool().classForName(type) : null;
        return !!(aClass && aClass.isHostOnly && aClass.isHostOnly());
    }

    /**
     * @description The entries a record of this type keeps in the projection:
     * its cloud JSON slots (isInCloudJson), and `subnodes` when the class
     * stores them, less its host-only and local-only slots. Null for a class
     * that is not a node (nothing of it is marked for players).
     * @returns {Set<String>|null}
     * @category Classes
     */
    keptSlotNamesForType (type) {
        const cache = SvPoolProjection.keptSlotNamesCache();
        if (!cache.has(type)) {
            cache.set(type, this.computeKeptSlotNames(type));
        }
        return cache.get(type);
    }

    computeKeptSlotNames (type) {
        const aClass = this.pool().classForName(type);
        if (!aClass || !aClass.cloudJsonSchemaSlots) {
            return null;
        }
        const localOnly = SvObjectPool.localOnlySlotNamesForType(type);
        const replicaClass = aClass.replicaClass ? aClass.replicaClass() : aClass;
        const replicaHas = (name) => !!replicaClass.prototype.allSlotsMap().get(name); // a replica holds only what its class has a slot for
        const names = new Set(aClass.cloudJsonSchemaSlots().filter(slot => !slot.isHostOnly() && !localOnly.has(slot.name()) && replicaHas(slot.name())).map(slot => slot.name()));
        if (aClass.prototype.shouldStoreSubnodes && aClass.prototype.shouldStoreSubnodes()) {
            names.add("subnodes");
        }
        return names;
    }

    static keptSlotNamesCache () {
        if (!this._keptSlotNamesCache) {
            this._keptSlotNamesCache = new Map();
        }
        return this._keptSlotNamesCache;
    }

    // --- commits ---

    /**
     * @description What changed since the projection's last committed state.
     * @returns {Object} { writes, deletes, snapshot, isEmpty } — writes and deletes as cloud rows/keys
     * @category Committing
     */
    changes () {
        const now = this.projectedRecords();
        const last = this.lastSnapshot() || new Map();
        const snapshot = new Map();
        const writes = [];
        now.forEach((row, pid) => {
            const signature = row.payloadJson + "\u0000" + row.parentId + "\u0000" + row.orderKey;
            snapshot.set(pid, signature);
            if (last.get(pid) !== signature) {
                writes.push(Object.assign({ poolId: this.cloudPoolId(), objectId: pid }, this.writeColumns(row)));
            }
        });
        const deletes = [...last.keys()].filter(pid => !now.has(pid)).map(pid => ({ poolId: this.cloudPoolId(), objectId: pid }));
        return { writes: writes, deletes: deletes, snapshot: snapshot, isEmpty: writes.length === 0 && deletes.length === 0 };
    }

    writeColumns (row) {
        const columns = { payloadJson: row.payloadJson };
        if (row.parentId) {
            columns.parentId = row.parentId;
            columns.orderKey = row.orderKey;
        }
        return columns;
    }

    /**
     * @description The projection's part of a commit.
     * @param {Object} changes - from changes()
     * @returns {Object} { poolId, baseVersion, writes, deletes, create? }
     * @category Committing
     */
    commitPart (changes) {
        const part = { poolId: this.cloudPoolId(), baseVersion: this.version(), writes: changes.writes, deletes: changes.deletes };
        if (this.version() === 0 && this.create()) {
            part.create = this.create();
        }
        return part;
    }

    didCommit (version, changes) {
        this.setVersion(version);
        this.setLastSnapshot(changes.snapshot);
        return this;
    }

    /**
     * @description The cloud projection moved on without us (a lost answer, a
     * second host): commit from its version, re-sending everything.
     * @category Committing
     */
    didConflict (version) {
        this.setVersion(version);
        this.setLastSnapshot(null);
        return this;
    }

    /**
     * @description The cloud projection is known to hold what the pool
     * projects now (a host reopening a session it last committed): the next
     * commit sends only what changes from here.
     * @category Committing
     */
    markInSync (version) {
        this.setVersion(version);
        this.setLastSnapshot(this.changes().snapshot);
        return this;
    }

}.initThisClass());
