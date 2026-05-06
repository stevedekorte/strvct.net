"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsDocument
 * @extends SvFsNode
 * @classdesc
 * A document node — mutable JSON content addressed by the node's id.
 * The pool + WAL deltas live in the backend's storage layer; this
 * class carries metadata (lease state, headSeq, schema version) and
 * provides accessors for opening a write/read session.
 *
 * The lease/delta state machine (`SvFsDocumentSession`) is intentionally
 * not implemented here yet — that lands in a follow-up slice.
 */

(class SvFsDocument extends SvFsNode {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
        {
            // Lease record: { uid, deviceId, expiresAt, headSeq } | null
            const slot = this.newSlot("lease", null);
            slot.setSlotType("Object");
        }
    }

    initPrototype () {
    }

    applyData (data) {
        super.applyData(data);
        if (data && "lease" in data) {
            this.setLease(data.lease);
        }
        return this;
    }

    documentClass () {
        const st = this.subtype() || {};
        return st.documentClass || null;
    }

    schemaVersion () {
        const st = this.subtype() || {};
        return typeof st.schemaVersion === "number" ? st.schemaVersion : null;
    }

    headSeq () {
        const lease = this.lease();
        return lease && typeof lease.headSeq === "number" ? lease.headSeq : 0;
    }

    leaseHolder () {
        const lease = this.lease();
        return lease ? lease.uid : null;
    }

    leaseExpiresAtMs () {
        const lease = this.lease();
        if (!lease) return 0;
        const e = lease.expiresAt;
        if (!e) return 0;
        if (typeof e === "number") return e;
        if (typeof e.toMillis === "function") return e.toMillis();
        if (typeof e.getTime === "function") return e.getTime();
        return Number(e) || 0;
    }

    leaseIsActive () {
        return Boolean(this.lease()) && this.leaseExpiresAtMs() > Date.now();
    }

    /**
     * Resolve readable URLs for the current pool + delta files.
     * @returns {Promise<{headSeq:number, poolUrl:string|null, deltas:Array<{seq:number,url:string}>}>}
     */
    async asyncReadUrls () {
        return this.client().backend().readDocument(this.id());
    }

    /**
     * Read the current pool.json as parsed JSON, ignoring any deltas.
     * Intended for documents written via `SvFsDocumentSession.asyncWriteSnapshot`,
     * where the entire content lives in pool.json on every save and the
     * delta stream is unused.
     * @returns {Promise<*|null>} parsed pool JSON, or null if pool absent
     */
    async asyncReadSnapshot () {
        const urls = await this.asyncReadUrls();
        if (!urls || !urls.poolUrl) return null;
        const resp = await fetch(urls.poolUrl);
        if (!resp.ok) {
            const e = new Error("pool.json fetch failed: " + resp.status + " " + resp.statusText);
            e.code = "internal";
            throw e;
        }
        return resp.json();
    }

    /**
     * Open an editing session (acquires lease, starts renewal).
     * @param {Object} [options]
     * @returns {Promise<SvFsDocumentSession>}
     */
    async asyncOpenSession (options) {
        const session = SvFsDocumentSession.forDocument(this, options);
        await session.open();
        return session;
    }

}.initThisClass());
