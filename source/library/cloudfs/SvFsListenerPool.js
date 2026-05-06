"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsListenerPool
 * @extends ProtoClass
 * @classdesc
 * App-wide registry of active backend listeners.
 *
 * Firestore caps a single client at ~100 simultaneous listeners. We
 * keep a soft warning band well below that and an effective cap that
 * preserves a small headroom for "standing" listeners (the per-user
 * collection-group queries on `_members` and `_invites` that always
 * stay attached).
 *
 * Standing listeners bypass the cap. Active-view listeners are
 * acquired/released by the view layer as columns mount and scroll
 * off-screen; the pool warns loudly if the count drifts above the
 * warning threshold (which usually means a column forgot to detach).
 */

(class SvFsListenerPool extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("warnAt", 80);
            slot.setSlotType("Number");
            slot.setComment("warn when active count >= this");
        }
        {
            const slot = this.newSlot("hardCap", 95);
            slot.setSlotType("Number");
            slot.setComment("refuse new non-standing acquires when active count >= this");
        }
        {
            // Map<handleId, {kind:'standing'|'active', label:string, unsubscribe:Function}>
            const slot = this.newSlot("handles", null);
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("nextHandleId", 1);
            slot.setSlotType("Number");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        this.setHandles(new Map());
        return this;
    }

    /**
     * Acquire a tracked listener slot.
     *
     * @param {Object} opts
     * @param {string} opts.label   short human-readable identifier ("folder:abc", "members:self")
     * @param {Function} opts.unsubscribe   the cleanup function returned by the backend's watch* call
     * @param {boolean} [opts.standing=false]   bypasses the hard cap; reserved for the always-on per-user listeners
     * @returns {Object} handle — pass to `release(handle)` to detach
     * @throws {Error} when the hard cap is reached for a non-standing acquire
     */
    acquire (opts) {
        const { label, unsubscribe, standing } = opts || {};
        if (typeof unsubscribe !== "function") {
            throw new Error("SvFsListenerPool.acquire: unsubscribe must be a function");
        }
        const handles = this.handles();
        const activeCount = this.activeCount();

        if (!standing && activeCount >= this.hardCap()) {
            throw new Error(
                "SvFsListenerPool: hard cap (" + this.hardCap() + ") reached; "
                + "non-standing acquire refused. Open: " + this.summary()
            );
        }
        if (activeCount + 1 >= this.warnAt()) {
            console.warn(
                this.svType() + ": " + (activeCount + 1) + " active listeners "
                + "(>= warnAt " + this.warnAt() + "). Latest: " + (label || "unlabelled")
            );
        }

        const id = this.nextHandleId();
        this.setNextHandleId(id + 1);

        const handle = { id, kind: standing ? "standing" : "active", label: label || "" };
        handles.set(id, { ...handle, unsubscribe });
        return handle;
    }

    /**
     * Release a previously-acquired listener. Idempotent — releasing a
     * handle that is no longer registered is a no-op.
     * @param {Object} handle
     */
    release (handle) {
        if (!handle || handle.id === undefined) return;
        const handles = this.handles();
        const entry = handles.get(handle.id);
        if (!entry) return;
        try {
            entry.unsubscribe();
        } catch (e) {
            console.warn(this.svType() + ": unsubscribe for " + entry.label + " threw: " + e.message);
        }
        handles.delete(handle.id);
    }

    /** Detach every listener currently in the pool. */
    releaseAll () {
        const ids = Array.from(this.handles().keys());
        for (const id of ids) {
            this.release({ id });
        }
    }

    /** Total active count incl. standing. */
    count () {
        return this.handles().size;
    }

    /** Active (non-standing) listener count. */
    activeCount () {
        let n = 0;
        for (const e of this.handles().values()) {
            if (e.kind !== "standing") n += 1;
        }
        return n;
    }

    /** Standing listener count. */
    standingCount () {
        return this.count() - this.activeCount();
    }

    /** Diagnostic summary string. */
    summary () {
        return "active=" + this.activeCount() + " standing=" + this.standingCount() + " total=" + this.count();
    }

    /** Returns array of {id, kind, label} for diagnostics. */
    snapshot () {
        return Array.from(this.handles().values()).map((e) => ({ id: e.id, kind: e.kind, label: e.label }));
    }

}.initThisClass());
