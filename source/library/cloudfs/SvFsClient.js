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

}.initThisClass());
