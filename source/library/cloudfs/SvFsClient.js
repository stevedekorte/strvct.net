"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsClient
 * @extends ProtoClass
 * @classdesc
 * Top-level facade for the cloud-filesystem layer. Holds the
 * `SvFsBackend` (transport) and the `SvFsListenerPool` (budget),
 * and provides convenience accessors for reading and watching nodes
 * by id.
 *
 * Apps wire this up once at boot, typically by:
 *   1. Constructing the application's concrete `SvFsBackend` subclass
 *      (e.g. `UoFsBackend extends SvFirebaseFsBackend`) which knows
 *      how to call the app's specific HTTP routes.
 *   2. Calling `SvFsClient.shared().setBackend(backendInstance)`.
 */

(class SvFsClient extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("backend", null);
            slot.setSlotType("SvFsBackend");
        }
        {
            const slot = this.newSlot("listenerPool", null);
            slot.setSlotType("SvFsListenerPool");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        this.setListenerPool(SvFsListenerPool.shared());
        return this;
    }

    /**
     * Read a single node and wrap it in the appropriate SvFsNode subclass.
     * @param {string} id
     * @returns {Promise<SvFsNode|null>}
     */
    async asyncReadNode (id) {
        const data = await this.backend().readNode(id);
        if (!data) return null;
        return SvFsNode.fromData(this, data);
    }

    /**
     * Watch a single node by id, delivering hydrated SvFsNode instances
     * (or null on delete) to the callback.
     * @param {string} id
     * @param {function(SvFsNode|null):void} onSnap
     * @param {function(Error):void} [onErr]
     * @returns {Object} listener-pool handle
     */
    watchNode (id, onSnap, onErr) {
        const unsubscribe = this.backend().watchNode(id, (data) => {
            onSnap(data ? SvFsNode.fromData(this, data) : null);
        }, onErr);
        return this.listenerPool().acquire({ label: "node:" + id, unsubscribe });
    }

    /** Release a handle returned by `watchNode`. */
    unwatch (handle) {
        this.listenerPool().release(handle);
    }

    /**
     * Ensure a document node exists at `id` and return it as an
     * `SvFsDocument`. If the node is missing, create it with the given
     * parent / scope / subtype metadata; if it already exists, just
     * read it back without touching its lease/headSeq state.
     *
     * Use this before opening a session to back app-level state on a
     * stable node id (e.g. UoCharacter.characterId() → one node per
     * character).
     *
     * @param {Object} args
     * @param {string} args.id            - Stable node id (e.g. character id).
     * @param {string} args.parentId      - Parent folder node id.
     * @param {string} args.scopeRootId   - Owning scope-root id (typically the user's home).
     * @param {string} [args.title]       - Display title (defaults to id).
     * @param {string} [args.sortKey]     - Sibling order key (defaults to id).
     * @param {Object} args.subtype       - { type:"document", documentClass, schemaVersion?, ... }
     * @param {string} [args.visibility="private"]
     * @returns {Promise<SvFsDocument>}
     */
    async asyncEnsureDocument (args) {
        const existing = await this.asyncReadNode(args.id);
        if (existing) {
            if (!(existing instanceof SvFsDocument)) {
                const e = new Error("node " + args.id + " exists but is not a document (" + existing.svType() + ")");
                e.code = "failed-precondition";
                throw e;
            }
            return existing;
        }

        const data = {
            id: args.id,
            parentId: args.parentId,
            sortKey: args.sortKey || args.id,
            scopeRootId: args.scopeRootId,
            visibility: args.visibility || "private",
            title: args.title || args.id,
            subtype: args.subtype,
            lease: null,
            lastModified: this.backend().serverTimestampSentinel(),
            childrenLastModified: this.backend().serverTimestampSentinel()
        };
        await this.backend().writeNode(args.id, data);
        const created = await this.asyncReadNode(args.id);
        if (!(created instanceof SvFsDocument)) {
            const e = new Error("created node " + args.id + " did not read back as document");
            e.code = "internal";
            throw e;
        }
        return created;
    }

    /**
     * Ensure a folder node exists at `id` and return it as an
     * `SvFsFolder`. Symmetric with `asyncEnsureDocument`.
     *
     * @param {Object} args
     * @param {string} args.id
     * @param {string} args.parentId
     * @param {string} args.scopeRootId
     * @param {string} [args.title]
     * @param {string} [args.sortKey]
     * @param {Object} [args.subtype]   - defaults to { type: "folder" }
     * @param {string} [args.visibility="private"]
     * @returns {Promise<SvFsFolder>}
     */
    async asyncEnsureFolder (args) {
        const existing = await this.asyncReadNode(args.id);
        if (existing) {
            if (!(existing instanceof SvFsFolder)) {
                const e = new Error("node " + args.id + " exists but is not a folder (" + existing.svType() + ")");
                e.code = "failed-precondition";
                throw e;
            }
            return existing;
        }

        const data = {
            id: args.id,
            parentId: args.parentId,
            sortKey: args.sortKey || args.id,
            scopeRootId: args.scopeRootId,
            visibility: args.visibility || "private",
            title: args.title || args.id,
            subtype: args.subtype || { type: "folder" },
            lastModified: this.backend().serverTimestampSentinel(),
            childrenLastModified: this.backend().serverTimestampSentinel()
        };
        await this.backend().writeNode(args.id, data);
        const created = await this.asyncReadNode(args.id);
        if (!(created instanceof SvFsFolder)) {
            const e = new Error("created node " + args.id + " did not read back as folder");
            e.code = "internal";
            throw e;
        }
        return created;
    }

}.initThisClass());
