"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsDocumentSession
 * @extends ProtoClass
 * @classdesc
 * Open editing session over a single `SvFsDocument`. Owns the
 * single-writer lease lifecycle and the WAL append flow:
 *
 *   open()  → acquireLease + start renewal timer + watchNode(doc) for
 *             lease-stolen / headSeq-advanced events
 *   close() → stop timer + releaseLease + detach watcher
 *   appendDelta(delta) → backend.appendDelta(expectedSeq=headSeq+1);
 *                         on success bump local headSeq
 *
 * The actual "what is a delta?" / "how to apply deltas to pool" lives
 * in the application — this class just orchestrates the WAL. A reader
 * pipeline (load pool.json + deltas, apply them) builds on top of
 * `SvFsDocument.asyncReadUrls()` and is intentionally not bundled into
 * the session.
 *
 * Multi-device behavior:
 *   - When another device steals the lease, the watcher fires with a
 *     lease.uid that's not us; the session enters a "lost" state and
 *     the next appendDelta rejects with code "permission-denied".
 *   - Caller can listen via setOnLeaseLost(cb).
 */

(class SvFsDocumentSession extends ProtoClass {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("document", null);
            slot.setSlotType("SvFsDocument");
        }
        {
            const slot = this.newSlot("deviceId", "default");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("leaseTtlMs", 60000);
            slot.setSlotType("Number");
            slot.setComment("Each acquire/renew refreshes for this many ms");
        }
        {
            const slot = this.newSlot("renewIntervalMs", 30000);
            slot.setSlotType("Number");
            slot.setComment("Renewal frequency while session is open");
        }
        {
            const slot = this.newSlot("currentLease", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("renewTimerHandle", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("nodeListenerHandle", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("isOpen", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("hasLostLease", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("onLeaseLost", null);
            slot.setSlotType("Function");
            slot.setComment("Called once when another writer steals our lease");
        }
        {
            const slot = this.newSlot("onHeadSeqAdvance", null);
            slot.setSlotType("Function");
            slot.setComment("Called when lease.headSeq advances (typically only after our own appendDelta)");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        return this;
    }

    static forDocument (document, options) {
        const s = SvFsDocumentSession.clone();
        s.setDocument(document);
        if (options) {
            if (options.deviceId) s.setDeviceId(options.deviceId);
            if (options.leaseTtlMs) s.setLeaseTtlMs(options.leaseTtlMs);
            if (options.renewIntervalMs) s.setRenewIntervalMs(options.renewIntervalMs);
            if (options.onLeaseLost) s.setOnLeaseLost(options.onLeaseLost);
            if (options.onHeadSeqAdvance) s.setOnHeadSeqAdvance(options.onHeadSeqAdvance);
        }
        return s;
    }

    backend () {
        return this.document().client().backend();
    }

    nodeId () {
        return this.document().id();
    }

    headSeq () {
        const lease = this.currentLease();
        return lease && typeof lease.headSeq === "number" ? lease.headSeq : 0;
    }

    /**
     * Acquire the lease, start the renewal timer, attach a node watcher.
     * Idempotent: re-opening an already-open session is a no-op.
     */
    async open () {
        if (this.isOpen()) return this;

        const backend = this.backend();
        const lease = await backend.acquireLease({
            nodeId: this.nodeId(),
            deviceId: this.deviceId(),
            ttlMs: this.leaseTtlMs()
        });
        this.setCurrentLease(lease);
        this.setIsOpen(true);
        this.setHasLostLease(false);

        this.startRenewTimer();
        this.attachNodeListener();

        return this;
    }

    /**
     * Release the lease, stop the timer, detach the watcher.
     * Idempotent.
     */
    async close () {
        if (!this.isOpen()) return this;
        this.setIsOpen(false);
        this.stopRenewTimer();
        this.detachNodeListener();
        try {
            await this.backend().releaseLease(this.nodeId());
        } catch (e) {
            console.warn("[SvFsDocumentSession] releaseLease failed (best-effort):", e.message);
        }
        this.setCurrentLease(null);
        return this;
    }

    /**
     * Append a delta. Callers typically don't need to worry about seq
     * — the session keeps track and bumps headSeq on success. If the
     * lease has been stolen, throws with code 'permission-denied'.
     * @param {*} delta
     * @returns {Promise<{seq:number}>}
     */
    async appendDelta (delta) {
        if (!this.isOpen()) {
            const e = new Error("session not open");
            e.code = "failed-precondition";
            throw e;
        }
        if (this.hasLostLease()) {
            const e = new Error("lease lost; reopen the session before appending");
            e.code = "permission-denied";
            throw e;
        }
        const expectedSeq = this.headSeq() + 1;
        const result = await this.backend().appendDelta({
            nodeId: this.nodeId(),
            expectedSeq,
            delta
        });
        // Bump local headSeq optimistically; node watcher will reconfirm.
        const lease = this.currentLease() || {};
        this.setCurrentLease({ ...lease, headSeq: expectedSeq });
        const cb = this.onHeadSeqAdvance();
        if (cb) cb(expectedSeq);
        return result;
    }

    /**
     * Replace the document's pool with `content` (a JSON-serializable
     * snapshot) and drop any accumulated deltas. Intended for documents
     * small enough that every save is a full overwrite — characters,
     * campaigns, and similar — where the WAL/coalesce machinery would
     * just be churn. After success, headSeq is reset to 0.
     *
     * Caller must hold the lease (session must be open).
     * @param {*} content
     * @returns {Promise<{deletedDeltas:number, headSeq:number}>}
     */
    async asyncWriteSnapshot (content) {
        if (!this.isOpen()) {
            const e = new Error("session not open");
            e.code = "failed-precondition";
            throw e;
        }
        if (this.hasLostLease()) {
            const e = new Error("lease lost; reopen the session before snapshotting");
            e.code = "permission-denied";
            throw e;
        }
        const result = await this.backend().coalesceDocument({
            nodeId: this.nodeId(),
            newPool: content
        });
        // headSeq is reset by coalesce; reflect that in our local lease.
        const lease = this.currentLease() || {};
        this.setCurrentLease({ ...lease, headSeq: 0 });
        return result;
    }

    // -------------------------------- internals

    startRenewTimer () {
        this.stopRenewTimer();
        const interval = setInterval(async () => {
            if (!this.isOpen() || this.hasLostLease()) return;
            try {
                const fresh = await this.backend().acquireLease({
                    nodeId: this.nodeId(),
                    deviceId: this.deviceId(),
                    ttlMs: this.leaseTtlMs()
                });
                // Preserve any local headSeq advance not yet reflected on the server.
                const localSeq = this.headSeq();
                if (typeof fresh.headSeq === "number" && fresh.headSeq > localSeq) {
                    this.setCurrentLease(fresh);
                } else {
                    this.setCurrentLease({ ...fresh, headSeq: localSeq });
                }
            } catch (e) {
                console.warn("[SvFsDocumentSession] renew failed:", e.message);
                if (e.code === "aborted" || e.code === "permission-denied") {
                    this.markLeaseLost();
                }
            }
        }, this.renewIntervalMs());
        this.setRenewTimerHandle(interval);
    }

    stopRenewTimer () {
        const h = this.renewTimerHandle();
        if (h) clearInterval(h);
        this.setRenewTimerHandle(null);
    }

    attachNodeListener () {
        if (this.nodeListenerHandle()) return;
        const client = this.document().client();
        const handle = client.watchNode(this.nodeId(), (node) => {
            if (!node) return;
            const lease = node instanceof SvFsDocument ? node.lease() : (node.rawData && node.rawData().lease);
            if (!lease) return;
            const myUid = this.currentLease() && this.currentLease().uid;
            if (myUid && lease.uid !== myUid) {
                this.markLeaseLost();
            } else if (typeof lease.headSeq === "number" && lease.headSeq > this.headSeq()) {
                const merged = this.currentLease() ? { ...this.currentLease(), headSeq: lease.headSeq } : lease;
                this.setCurrentLease(merged);
                const cb = this.onHeadSeqAdvance();
                if (cb) cb(lease.headSeq);
            }
        });
        this.setNodeListenerHandle(handle);
    }

    detachNodeListener () {
        const handle = this.nodeListenerHandle();
        if (!handle) return;
        this.document().client().unwatch(handle);
        this.setNodeListenerHandle(null);
    }

    markLeaseLost () {
        if (this.hasLostLease()) return;
        this.setHasLostLease(true);
        this.stopRenewTimer();
        const cb = this.onLeaseLost();
        if (cb) cb();
    }

}.initThisClass());
