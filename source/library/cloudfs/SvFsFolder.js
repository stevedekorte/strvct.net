"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsFolder
 * @extends SvFsNode
 * @classdesc
 * A folder node. Folders are containers — they have a
 * `childrenLastModified` field maintained by the backend trigger and
 * can be listened to via `attachChildrenListener()`.
 *
 * High-write-rate folders (active multiplayer sessions, collaborative
 * scopes) carry `subtype.highWriteRate: true` so the framework knows to
 * skip the cache-validation pattern and use the listener directly.
 */

(class SvFsFolder extends SvFsNode {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("childrenLastModified", null);
            slot.setSlotType("Object");
        }
        {
            // Listener-pool handle for the children query, when attached.
            const slot = this.newSlot("childrenListenerHandle", null);
            slot.setSlotType("Object");
        }
        {
            // Most-recent children snapshot, for cached reads.
            const slot = this.newSlot("childrenCache", null);
            slot.setSlotType("Array");
        }
        {
            // Caller's snapshot callback, set on attachChildrenListener.
            const slot = this.newSlot("onChildrenChange", null);
            slot.setSlotType("Function");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        this.setChildrenCache([]);
        return this;
    }

    applyData (data) {
        super.applyData(data);
        if (data && "childrenLastModified" in data) {
            this.setChildrenLastModified(data.childrenLastModified);
        }
        return this;
    }

    isHighWriteRate () {
        const st = this.subtype();
        return Boolean(st && st.highWriteRate === true);
    }

    /**
     * Attach a listener for this folder's direct children. Returns this
     * for chaining; cleanup via `detachChildrenListener()`.
     *
     * @param {Object} opts
     * @param {number} [opts.limit=50]   page size; the plan default is 50
     * @param {string} [opts.startAfterSortKey]
     * @param {function(Array<SvFsNode>):void} opts.onSnap   called with the latest children list
     * @param {function(Error):void}            [opts.onErr]
     * @returns {SvFsFolder} this
     */
    attachChildrenListener (opts) {
        if (this.childrenListenerHandle()) {
            // Already attached — replace the snapshot callback so the
            // caller can repoint a single listener at a new consumer.
            if (opts && opts.onSnap) this.setOnChildrenChange(opts.onSnap);
            return this;
        }

        const client = this.client();
        if (!client) throw new Error("SvFsFolder.attachChildrenListener: client not set");

        const limit = (opts && opts.limit) || 50;
        const startAfterSortKey = opts && opts.startAfterSortKey;
        const onSnap = (opts && opts.onSnap) || (() => {});
        const onErr = (opts && opts.onErr) || ((e) => console.error("[SvFsFolder] listener error: " + e.message));

        this.setOnChildrenChange(onSnap);

        const unsubscribe = client.backend().watchChildren(
            this.id(),
            { limit, startAfterSortKey },
            (rawList) => {
                const nodes = (rawList || []).map((d) => SvFsNode.fromData(client, d));
                this.setChildrenCache(nodes);
                const cb = this.onChildrenChange();
                if (cb) cb(nodes);
            },
            onErr
        );

        const handle = client.listenerPool().acquire({
            label: "folder:" + this.id(),
            unsubscribe
        });
        this.setChildrenListenerHandle(handle);
        return this;
    }

    /** Detach the children listener if any. Idempotent. */
    detachChildrenListener () {
        const handle = this.childrenListenerHandle();
        if (!handle) return this;
        this.client().listenerPool().release(handle);
        this.setChildrenListenerHandle(null);
        this.setOnChildrenChange(null);
        return this;
    }

    /**
     * Cache-validation read: cheap point-read of this folder doc; if
     * `childrenLastModified` hasn't advanced past the caller's stamp,
     * the cached children are still fresh and no children query runs.
     * Returns the children array.
     *
     * @param {Object} [knownChildrenLastModifiedMs] last cache stamp (millis)
     * @returns {Promise<Array<SvFsNode>>}
     */
    async asyncFetchChildrenIfStale (knownChildrenLastModifiedMs) {
        const client = this.client();
        if (!client) throw new Error("SvFsFolder.asyncFetchChildrenIfStale: client not set");

        // Refresh THIS folder doc to pick up the latest childrenLastModified.
        const fresh = await client.backend().readNode(this.id());
        if (fresh) this.applyData(fresh);

        const curMs = SvFsFolder.timestampToMillis(this.childrenLastModified());
        if (knownChildrenLastModifiedMs != null && curMs <= knownChildrenLastModifiedMs) {
            // Cache still fresh; return whatever's in the in-memory cache.
            return this.childrenCache() || [];
        }

        // Stale — run a one-shot children read via a watcher we immediately detach.
        const items = await new Promise((resolve, reject) => {
            const stop = client.backend().watchChildren(
                this.id(), { limit: 50 },
                (rawList) => {
                    stop();
                    resolve((rawList || []).map((d) => SvFsNode.fromData(client, d)));
                },
                (e) => { try { stop(); } catch (_) { /* */ } reject(e); }
            );
        });
        this.setChildrenCache(items);
        return items;
    }

    static timestampToMillis (ts) {
        if (!ts) return 0;
        if (typeof ts === "number") return ts;
        if (typeof ts.toMillis === "function") return ts.toMillis();
        if (typeof ts.getTime === "function") return ts.getTime();
        return 0;
    }

}.initThisClass());
