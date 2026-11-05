"use strict";

/**
 * @module library.node.nodes.base
 */

/**
 * @class SvNode_windowedCollections
 * @extends SvNode
 * @classdesc Windowed collections (Plans/Record Store §6): loading the newest window of a collection's elements and older windows on demand, and the hooks that keep a loaded window in step with arriving and departing elements.
 * A category of SvNode, split from SvNode.js unchanged (Plans/Cleanup § 3).
 */
(class SvNode_windowedCollections extends SvNode {

    // --- windowed collections (Plans/Record Store §6) ---

    /**
     * @description How many of the newest elements a windowed collection loads
     * when first accessed; older ones load by range on request.
     * @category Record Store
     */
    windowSize () {
        return 200;
    }

    windowedPool () {
        return SvObjectPool.poolOfObject(this) || null;
    }

    /**
     * @description Whether the store holds elements this node has not loaded.
     * @category Record Store
     */
    hasUnloadedSubnodes () {
        return this.subnodesAreWindowed() && this.subnodeCount() > (this._subnodes ? this._subnodes.length : 0);
    }

    /**
     * @description Loads the newest window of a windowed collection from the
     * local store (synchronous: the store's rows are in memory) — the whole
     * collection when it is smaller than the window. A load, not an edit:
     * nothing is dirtied; the views are told through the update note.
     * @category Record Store
     */
    loadLatestWindow () {
        return this.loadWindowBefore(null, this.windowSize());
    }

    /**
     * @description Loads the newest window when a windowed collection has none
     * loaded yet but its store holds elements. Anything that projects the
     * collection (serializeToJson) must call this first: an unloaded window
     * reads as an empty list, so a host that reloaded published bus snapshots
     * with no chat history at all — every client that joined from one started
     * at the same message until it asked for a resync (prod, 2026-09-24).
     * @returns {SvNode}
     * @category Record Store
     */
    loadLatestWindowIfNoneLoaded () {
        const noneLoaded = !this._subnodes || this._subnodes.length === 0;
        if (this.subnodesAreWindowed() && noneLoaded && this.hasUnloadedSubnodes()) {
            this.loadLatestWindow();
        }
        return this;
    }

    /**
     * @description Loads up to `limit` elements older than the oldest loaded one
     * (or than `beforeKey`) and inserts them at the front, in order.
     * @returns {Number} how many were loaded
     * @category Record Store
     */
    loadOlderWindow (limit) {
        const first = this._subnodes ? this._subnodes.first() : null;
        const pool = this.windowedPool();
        const firstKey = (first && pool) ? pool.orderKeyForPid(first.puuid()) : null;
        return this.loadWindowBefore(firstKey, limit || this.windowSize());
    }

    loadWindowBefore (beforeKey, limit) {
        const pool = this.windowedPool();
        if (!pool || !this.subnodesAreWindowed()) {
            return 0;
        }
        pool.beginWindowLoad(); // attaching the loaded elements is a load, not an edit: no enrollment, no dirtying
        let loaded;
        try {
            loaded = pool.loadWindowedElements(this, beforeKey, limit);
            if (loaded.length > 0) {
                this.insertLoadedElementsAtFront(loaded);
            }
        } finally {
            pool.endWindowLoad();
        }
        if (loaded.length > 0) {
            this.didLoadWindow(loaded);
        }
        return loaded.length;
    }

    insertLoadedElementsAtFront (elements) {
        const array = this.subnodes();
        const known = new Set(array);
        const fresh = elements.filter(e => !known.has(e));
        array.unhooked_splice(0, 0, ...fresh); // a load: the array is not a stored object here and must not dirty
        fresh.forEach(e => e.setParentNode(this));
        this.scheduleMethod("onDidReorderSubnodes");
        if (this.hasDoneInit()) {
            const note = this.didUpdateNodeNote();
            if (note) {
                note.post(); // views re-read; never didUpdateNode(), which walks application hooks
            }
        }
        return this;
    }

    didLoadWindow (/*elements*/) {
        // subclasses: hygiene that ran on materialization before (a chat's stale drafts)
    }

    /**
     * @description Windowed elements that arrived from elsewhere (a replica
     * applying its host's changes) join the loaded window in order-key order
     * — a new chat message lands at the end. A load, not an edit: nothing is
     * dirtied; the views are told through the update note.
     * @param {Array<SvNode>} elements
     * @returns {SvNode}
     * @category Record Store
     */
    didReceiveWindowedElements (elements) {
        const pool = this.windowedPool();
        const array = this.subnodes();
        const known = new Set(array);
        const fresh = elements.filter(e => e && !known.has(e));
        if (!pool || fresh.length === 0) {
            return this;
        }
        const keyOf = (e) => pool.orderKeyForPid(e.puuid()) || "";
        const merged = array.slice().concat(fresh).sort((a, b) => (keyOf(a) < keyOf(b) ? -1 : (keyOf(a) > keyOf(b) ? 1 : 0)));
        array.unhooked_splice(0, array.length, ...merged); // a load: the array is not a stored object here and must not dirty
        fresh.forEach(e => e.setParentNode(this));
        this.didLoadWindow(fresh);
        return this.noteWindowChanged();
    }

    /**
     * @description A windowed element removed elsewhere (a replica applying
     * its host's changes) leaves the loaded window.
     * @param {SvNode} element
     * @returns {SvNode}
     * @category Record Store
     */
    didLoseWindowedElement (element) {
        const array = this.subnodes();
        const index = array.indexOf(element);
        if (index === -1) {
            return this;
        }
        array.unhooked_splice(index, 1);
        return this.noteWindowChanged();
    }

    noteWindowChanged () {
        this.scheduleMethod("onDidReorderSubnodes");
        if (this.hasDoneInit()) {
            const note = this.didUpdateNodeNote();
            if (note) {
                note.post(); // views re-read; never didUpdateNode(), which walks application hooks
            }
        }
        return this;
    }

}.initThisCategory());
