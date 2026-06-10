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

    /**
     * One-shot get() of direct children. Used for `asyncListChildren`
     * where we don't want a subscription and want server-consistent
     * results immediately (avoiding the cache-then-server snapshot
     * sequence that onSnapshot delivers — which can race against a
     * just-server-written doc and return a stale empty list first).
     */
    async listChildren (parentId, opts) {
        let q = this.nodesCol().where("parentId", "==", parentId);
        if (opts && opts.scopeRootId) q = q.where("scopeRootId", "==", opts.scopeRootId);
        q = q.orderBy("sortKey");
        if (opts && opts.startAfterSortKey) q = q.startAfter(opts.startAfterSortKey);
        if (opts && opts.limit) q = q.limit(opts.limit);
        const snap = await q.get({ source: "server" });
        const list = [];
        snap.forEach((d) => list.push(d.data()));
        return list;
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
            // Preserve headSeq across lease release. Setting lease=null
            // would discard the WAL sequence counter, and the next
            // acquireLease would reset it to 0 — causing the next
            // appendDelta to overwrite the existing seq=1 file in
            // Storage, silently losing whatever was in the previous
            // delta. Keep the lease object as a "no editor" sentinel
            // (uid=null, expiresAt=null) but carry headSeq forward.
            const releasedLease = {
                uid: null,
                deviceId: null,
                expiresAt: null,
                headSeq: typeof cur.headSeq === "number" ? cur.headSeq : 0
            };
            tx.update(ref, {
                lease: releasedLease,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }

    // ---------------------------------------------------------------- membership discovery

    async listMyMemberships () {
        const uid = this._currentUid();
        if (!uid) return [];
        const snap = await this.firestore()
            .collectionGroup("_members")
            .where("uid", "==", uid)
            .get({ source: "server" });
        const out = [];
        snap.forEach((d) => {
            const data = d.data();
            if (data && data.scopeRootId) out.push(data);
        });
        return out;
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

    serverTimestampSentinel () {
        return firebase.firestore.FieldValue.serverTimestamp();
    }

    // callFunction stays abstract — app subclass implements HTTP transport.

    // ---------------------------------------------------------------- multiplayer subcollections

    // ---------------------------------------------------------------- HAEB event bus (RTDB-backed)
    //
    // The host-authoritative event bus lives in RTDB as three top-level trees
    // keyed by sessionId (kept separate so the tiny ACL record isn't bloated
    // by the event log):
    //   /events/{sessionId}/{seq}          host writes; members read (append-only log)
    //   /requests/{sessionId}/{uid}/{id}   clients write own uid; host reads
    //   /sessions/{sessionId}              { hostUid, memberUids } ACL record (CF-written)
    //
    // `seq` is a host-assigned monotonic integer. Event keys are zero-padded
    // so RTDB orderByKey() == chronological order (lexicographic == numeric).
    // The rules read the ACL from /sessions/{sessionId}.

    _eventsRef (sessionId) {
        return firebase.database().ref("events/" + sessionId);
    }

    _requestsRef (sessionId) {
        return firebase.database().ref("requests/" + sessionId);
    }

    /**
     * One-shot read of the HAEB session ACL record /sessions/{sessionId}
     * ({ hostUid, memberUids }). Returns null if it doesn't exist. The
     * read rule for /sessions is `auth != null`, so any signed-in user
     * can pre-flight a join with this (e.g. to detect a stale/unknown
     * session before subscribing to /events).
     */
    async readSessionRecord (sessionId) {
        const snap = await firebase.database().ref("sessions/" + sessionId).once("value");
        return snap.exists() ? snap.val() : null;
    }

    _seqKey (seq) {
        return String(seq).padStart(12, "0");
    }

    /**
     * Host: append an event at the given seq. Stamps seq + server time.
     */
    async emitEvent (sessionId, seq, eventData) {
        const payload = Object.assign({}, eventData || {});
        payload.seq = seq;
        payload.serverTime = firebase.database.ServerValue.TIMESTAMP;
        await this._eventsRef(sessionId).child(this._seqKey(seq)).set(payload);
    }

    /**
     * Host: recover the max existing seq (for the in-memory counter on restart).
     * Returns -1 if the log is empty.
     */
    async maxEventSeq (sessionId) {
        const snap = await this._eventsRef(sessionId).orderByKey().limitToLast(1).once("value");
        let maxSeq = -1;
        snap.forEach((child) => {
            const v = child.val();
            const s = (v && typeof v.seq === "number") ? v.seq : parseInt(child.key, 10);
            if (typeof s === "number" && isFinite(s)) maxSeq = s;
        });
        return maxSeq;
    }

    /**
     * Member: subscribe to events with seq > sinceSeq, in order, then live.
     * Pass sinceSeq = -1 (or null) to replay from seq=0 (the snapshot).
     * Returns an unsubscribe function.
     */
    watchEvents (sessionId, sinceSeq, onEvent, onErr) {
        let q = this._eventsRef(sessionId).orderByKey();
        if (typeof sinceSeq === "number" && sinceSeq >= 0) {
            q = q.startAfter(this._seqKey(sinceSeq));
        }
        const onAdded = (snap) => {
            const v = snap.val();
            if (v) onEvent(v);
        };
        const onError = (err) => {
            if (onErr) onErr(err);
            else console.error("[SvFirebaseFsBackend] watchEvents error:", err);
        };
        q.on("child_added", onAdded, onError);
        return () => {
            try { q.off("child_added", onAdded); }
            catch (e) { console.warn("[SvFirebaseFsBackend] events off failed:", e && e.message); }
        };
    }

    /**
     * Client: send a request under the client's own uid.
     */
    async sendRequest (sessionId, uid, requestId, requestData) {
        const payload = Object.assign({}, requestData || {});
        payload.senderRequestId = requestId;
        payload.clientTime = firebase.database.ServerValue.TIMESTAMP;
        await this._requestsRef(sessionId).child(uid).child(requestId).set(payload);
    }

    /**
     * Host: subscribe to all members' inbound requests. requests/{uid}/{id}
     * is two levels deep, so we watch child_added at the requests root for
     * per-uid buckets, and child_added within each bucket for individual
     * requests. onRequest receives { uid, requestId, request }.
     * Returns an unsubscribe function.
     */
    watchRequests (sessionId, onRequest, onErr) {
        const ref = this._requestsRef(sessionId);
        const uidUnsubs = new Map();
        const onError = (err) => {
            if (onErr) onErr(err);
            else console.error("[SvFirebaseFsBackend] watchRequests error:", err);
        };
        const watchUid = (uid) => {
            if (uidUnsubs.has(uid)) return;
            const uidRef = ref.child(uid);
            const onReq = (snap) => {
                const v = snap.val();
                if (v) onRequest({ uid, requestId: snap.key, request: v });
            };
            uidRef.on("child_added", onReq, onError);
            uidUnsubs.set(uid, () => { try { uidRef.off("child_added", onReq); } catch (e) { /* noop */ } });
        };
        const onUidAdded = (snap) => watchUid(snap.key);
        ref.on("child_added", onUidAdded, onError);
        return () => {
            try { ref.off("child_added", onUidAdded); } catch (e) { /* noop */ }
            uidUnsubs.forEach((u) => u());
            uidUnsubs.clear();
        };
    }

    /**
     * Host: delete a processed request (apply-then-delete; idempotent apply
     * makes a crash-replay harmless). Backstopped by a CF sweep for orphans.
     */
    async deleteRequest (sessionId, uid, requestId) {
        await this._requestsRef(sessionId).child(uid).child(requestId).remove();
    }

    // ---------------------------------------------------------------- liveness (RTDB onDisconnect)
    //
    // /live/{sessionId}/{uid} — each member writes its own presence node and
    // registers onDisconnect().remove(), so RTDB clears it automatically when
    // the connection drops. This replaces heartbeat polling + a stale-sweep.

    _liveRef (sessionId) {
        return firebase.database().ref("live/" + sessionId);
    }

    /**
     * Announce presence at /live/{sessionId}/{uid} and arm onDisconnect so the
     * node is removed automatically on disconnect. `data` carries identity
     * (displayName, characterId, characterJson, isConnected).
     */
    async setLiveNode (sessionId, uid, data) {
        const ref = this._liveRef(sessionId).child(uid);
        const payload = Object.assign({}, data || {});
        payload.connectedAt = firebase.database.ServerValue.TIMESTAMP;
        ref.onDisconnect().remove();
        await ref.set(payload);
    }

    /**
     * Explicitly remove our live node (clean leave) and cancel the
     * onDisconnect so it doesn't fire spuriously after.
     */
    async clearLiveNode (sessionId, uid) {
        const ref = this._liveRef(sessionId).child(uid);
        ref.onDisconnect().cancel();
        await ref.remove();
    }

    /**
     * Watch the live roster. onSnap receives a map { uid: data } on every
     * change (connect/disconnect). Returns an unsubscribe function.
     */
    watchLive (sessionId, onSnap, onErr) {
        const ref = this._liveRef(sessionId);
        const onValue = (snap) => onSnap(snap.val() || {});
        const onError = (err) => {
            if (onErr) onErr(err);
            else console.error("[SvFirebaseFsBackend] watchLive error:", err);
        };
        ref.on("value", onValue, onError);
        return () => {
            try { ref.off("value", onValue); }
            catch (e) { console.warn("[SvFirebaseFsBackend] live off failed:", e && e.message); }
        };
    }

}.initThisClass());
