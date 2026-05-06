"use strict";

/**
 * @module library.cloudfs.firebase
 */

/**
 * @class SvFirebaseFsBackend
 * @extends SvFsBackend
 * @classdesc
 * Firebase-backed concrete implementation of SvFsBackend.
 *
 * Direct CRUD on the `Nodes` collection and `blobs/{hash}` Storage
 * objects use the Firebase compat SDK (`firebase.firestore()`,
 * `firebase.app().storage()`). Server-side function calls — uploadBlob,
 * appendDelta, coalesceDocument, copyNode, deleteSubtree, invites,
 * ensure-home — are routed through `callFunction(name, args)`, which
 * stays abstract: the application provides a subclass that knows how
 * to reach its specific HTTP endpoint set.
 *
 * Browser-only. A future test backend can subclass `SvFsBackend`
 * directly with an in-memory data plane.
 */

(class SvFirebaseFsBackend extends SvFsBackend {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
        {
            // Default storage bucket name to use for blobs (e.g. "myproject.firebasestorage.app").
            // null → use firebase.app().storage() default.
            const slot = this.newSlot("blobsBucket", null);
            slot.setSlotType("String");
        }
        {
            // The Firestore collection name. Default per the plan.
            const slot = this.newSlot("nodesCollectionName", "Nodes");
            slot.setSlotType("String");
        }
        {
            // The Firebase Storage prefix for blobs. Default per the plan.
            const slot = this.newSlot("blobPathPrefix", "blobs/");
            slot.setSlotType("String");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        return this;
    }

    // ---------------------------------------------------------------- helpers

    firestore () {
        if (typeof firebase === "undefined" || !firebase.firestore) {
            throw new Error("SvFirebaseFsBackend: firebase.firestore is not available");
        }
        return firebase.firestore();
    }

    storage () {
        if (typeof firebase === "undefined" || !firebase.app) {
            throw new Error("SvFirebaseFsBackend: firebase.app is not available");
        }
        const bucket = this.blobsBucket();
        return bucket ? firebase.app().storage("gs://" + bucket) : firebase.app().storage();
    }

    nodesCol () {
        return this.firestore().collection(this.nodesCollectionName());
    }

    nodeRef (id) {
        return this.nodesCol().doc(id);
    }

    // ---------------------------------------------------------------- node CRUD

    async readNode (id) {
        const snap = await this.nodeRef(id).get();
        return snap.exists ? snap.data() : null;
    }

    watchNode (id, onSnap, onErr) {
        return this.nodeRef(id).onSnapshot(
            (snap) => onSnap(snap.exists ? snap.data() : null),
            (err) => { if (onErr) onErr(err); else console.error("[SvFirebaseFsBackend] watchNode error:", err); }
        );
    }

    /**
     * Listen to direct children of `parentId`.
     *
     * Firestore's rule evaluator denies LIST queries unless it can prove
     * the read rule grants access for every potential match. For our
     * Nodes rule (which gates on `resource.data.scopeRootId`) the query
     * MUST include a matching `where("scopeRootId", "==", ...)` clause
     * so the engine can substitute and verify. Pass it via
     * `opts.scopeRootId` — the framework supplies it from the parent
     * folder's scope.
     */
    watchChildren (parentId, opts, onSnap, onErr) {
        let q = this.nodesCol().where("parentId", "==", parentId);
        if (opts && opts.scopeRootId) q = q.where("scopeRootId", "==", opts.scopeRootId);
        q = q.orderBy("sortKey");
        if (opts && opts.startAfterSortKey) q = q.startAfter(opts.startAfterSortKey);
        if (opts && opts.limit) q = q.limit(opts.limit);
        return q.onSnapshot(
            (snap) => {
                const list = [];
                snap.forEach((d) => list.push(d.data()));
                onSnap(list);
            },
            (err) => { if (onErr) onErr(err); else console.error("[SvFirebaseFsBackend] watchChildren error:", err); }
        );
    }

    async writeNode (id, data) {
        await this.nodeRef(id).set(data);
    }

    async updateNode (id, patch) {
        await this.nodeRef(id).update(patch);
    }

    async deleteNode (id) {
        await this.nodeRef(id).delete();
    }

    // ---------------------------------------------------------------- blobs

    /**
     * Default URL resolution: returns a Firebase Storage download URL
     * for `<blobPathPrefix><hash>`. App subclasses can override to
     * point at a public-read GCS bucket, a signed URL, etc.
     */
    async blobUrl (hash) {
        const path = this.blobPathPrefix() + hash;
        return this.storage().ref(path).getDownloadURL();
    }

    // ---------------------------------------------------------------- documents (lease + WAL)

    /**
     * Acquire or renew the single-writer lease on a document, in a
     * Firestore transaction. Succeeds only if no active lease exists
     * for a different uid/deviceId.
     */
    async acquireLease ({ nodeId, deviceId, ttlMs }) {
        const ttl = Number.isInteger(ttlMs) && ttlMs > 0 ? ttlMs : 60000;
        const ref = this.nodeRef(nodeId);
        const callerUid = this._currentUid();

        return this.firestore().runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw this._mkErr("not-found", "node not found: " + nodeId);
            const data = snap.data();
            if (!data.subtype || data.subtype.type !== "document") {
                throw this._mkErr("failed-precondition", "node is not a document");
            }

            const cur = data.lease || null;
            const nowMs = Date.now();
            const curExpiresMs = cur && cur.expiresAt ? this._toMillis(cur.expiresAt) : 0;
            const heldByOther = cur && cur.uid !== callerUid && curExpiresMs > nowMs;
            if (heldByOther) {
                throw this._mkErr("aborted", "lease held by another user/device until " + new Date(curExpiresMs).toISOString());
            }

            const fresh = {
                uid: callerUid,
                deviceId: deviceId || (cur && cur.deviceId) || "default",
                expiresAt: new Date(nowMs + ttl),
                headSeq: cur && typeof cur.headSeq === "number" ? cur.headSeq : 0
            };
            tx.update(ref, {
                lease: fresh,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return fresh;
        });
    }

    async releaseLease (nodeId) {
        const ref = this.nodeRef(nodeId);
        const callerUid = this._currentUid();

        await this.firestore().runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) return;
            const data = snap.data();
            const cur = data.lease;
            if (!cur || cur.uid !== callerUid) return;
            tx.update(ref, {
                lease: null,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }

    // ---------------------------------------------------------------- helpers

    _currentUid () {
        if (typeof firebase === "undefined" || !firebase.auth || !firebase.auth().currentUser) {
            throw this._mkErr("unauthenticated", "no current Firebase user");
        }
        return firebase.auth().currentUser.uid;
    }

    _toMillis (ts) {
        if (!ts) return 0;
        if (typeof ts === "number") return ts;
        if (typeof ts.toMillis === "function") return ts.toMillis();
        if (typeof ts.getTime === "function") return ts.getTime();
        if (typeof ts.seconds === "number") return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
        return 0;
    }

    _mkErr (code, message) {
        const e = new Error(message);
        e.code = code;
        return e;
    }

    // callFunction stays abstract — app subclass implements HTTP transport.

}.initThisClass());
