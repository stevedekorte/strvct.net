"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsJsonDocument
 * @extends ProtoClass
 * @classdesc
 * Generic JSON-state document binding. Provides the reader pipeline
 * (fetch pool.json, fetch ordered deltas, apply them) and the writer
 * shortcut (apply a delta locally + append via the session) on top of
 * `SvFsDocument` + `SvFsDocumentSession`.
 *
 * Pluggable delta semantics: the caller supplies an `applyDelta(state,
 * delta) → state` function. Defaults to RFC-6902 JSON Patch when the
 * delta looks like an array of patch ops; falls back to shallow merge
 * for plain-object deltas.
 *
 * The class is intentionally schema-agnostic so applications can use
 * the WAL pattern with whatever in-memory shape suits them. Higher-
 * level integrations (e.g. binding an SvObjectPool to a cloudfs
 * document) build on this rather than duplicating the load/apply work.
 */

(class SvFsJsonDocument extends ProtoClass {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("document", null);
            slot.setSlotType("SvFsDocument");
        }
        {
            const slot = this.newSlot("state", null);
            slot.setSlotType("Object");
            slot.setComment("current materialized JSON state");
        }
        {
            const slot = this.newSlot("loadedHeadSeq", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("applyDeltaFn", null);
            slot.setSlotType("Function");
            slot.setComment("(state, delta) → state. Default: detect RFC6902 patch vs shallow-merge.");
        }
        {
            const slot = this.newSlot("initialPool", null);
            slot.setSlotType("Object");
            slot.setComment("seed pool used when no pool.json exists yet");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        this.setApplyDeltaFn(SvFsJsonDocument.defaultApplyDelta);
        this.setInitialPool({});
        this.setState({});
        return this;
    }

    static forDocument (document, options) {
        const d = SvFsJsonDocument.clone();
        d.setDocument(document);
        if (options) {
            if (options.applyDeltaFn) d.setApplyDeltaFn(options.applyDeltaFn);
            if (options.initialPool) d.setInitialPool(options.initialPool);
        }
        return d;
    }

    /**
     * Default delta-application strategy:
     * - if delta looks like an RFC 6902 patch array → apply RFC 6902 ops
     * - else if both state and delta are plain objects → shallow merge
     * - else throw
     */
    static defaultApplyDelta (state, delta) {
        if (Array.isArray(delta) && delta.every((op) => op && typeof op === "object" && typeof op.op === "string")) {
            return SvFsJsonDocument.applyJsonPatch(state, delta);
        }
        if (state && delta && typeof state === "object" && typeof delta === "object") {
            return Object.assign({}, state, delta);
        }
        throw new Error("SvFsJsonDocument.defaultApplyDelta: cannot merge "
            + (Array.isArray(delta) ? "array" : typeof delta) + " into "
            + (typeof state));
    }

    /**
     * Tiny RFC 6902 JSON Patch applier. Supports add/remove/replace/copy/move/test.
     * Operates on a deep-cloned state so external references aren't mutated.
     */
    static applyJsonPatch (state, ops) {
        const root = JSON.parse(JSON.stringify(state || {}));
        for (const op of ops) {
            SvFsJsonDocument._applyOne(root, op);
        }
        return root;
    }

    static _applyOne (root, op) {
        switch (op.op) {
            case "add":     return SvFsJsonDocument._addAt(root, op.path, op.value);
            case "replace": return SvFsJsonDocument._replaceAt(root, op.path, op.value);
            case "remove":  return SvFsJsonDocument._removeAt(root, op.path);
            case "copy": {
                const from = SvFsJsonDocument._getAt(root, op.from);
                return SvFsJsonDocument._addAt(root, op.path, JSON.parse(JSON.stringify(from)));
            }
            case "move": {
                const from = SvFsJsonDocument._getAt(root, op.from);
                SvFsJsonDocument._removeAt(root, op.from);
                return SvFsJsonDocument._addAt(root, op.path, from);
            }
            case "test": {
                const cur = SvFsJsonDocument._getAt(root, op.path);
                if (JSON.stringify(cur) !== JSON.stringify(op.value)) {
                    throw new Error("JSON patch 'test' failed at " + op.path);
                }
                return;
            }
            default:
                throw new Error("Unsupported JSON patch op: " + op.op);
        }
    }

    static _splitPath (path) {
        if (path === "" || path === "/") return [];
        if (path[0] !== "/") throw new Error("invalid JSON pointer: " + path);
        return path.slice(1).split("/").map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
    }

    static _getAt (root, path) {
        const segs = SvFsJsonDocument._splitPath(path);
        let cur = root;
        for (const s of segs) {
            if (cur == null) return undefined;
            cur = Array.isArray(cur) ? cur[Number(s)] : cur[s];
        }
        return cur;
    }

    static _addAt (root, path, value) {
        const segs = SvFsJsonDocument._splitPath(path);
        if (segs.length === 0) {
            // Replace root
            for (const k of Object.keys(root)) delete root[k];
            Object.assign(root, value);
            return;
        }
        const last = segs.pop();
        let cur = root;
        for (const s of segs) {
            cur = Array.isArray(cur) ? cur[Number(s)] : cur[s];
        }
        if (Array.isArray(cur)) {
            if (last === "-") cur.push(value);
            else cur.splice(Number(last), 0, value);
        } else {
            cur[last] = value;
        }
    }

    static _replaceAt (root, path, value) {
        // RFC 6902 says replace == remove + add at the same path.
        SvFsJsonDocument._addAt(root, path, value);
    }

    static _removeAt (root, path) {
        const segs = SvFsJsonDocument._splitPath(path);
        if (segs.length === 0) {
            for (const k of Object.keys(root)) delete root[k];
            return;
        }
        const last = segs.pop();
        let cur = root;
        for (const s of segs) {
            cur = Array.isArray(cur) ? cur[Number(s)] : cur[s];
        }
        if (Array.isArray(cur)) cur.splice(Number(last), 1);
        else delete cur[last];
    }

    // ---------------------------------------------------------------- reader

    /**
     * Fetch pool.json + ordered deltas and apply them. Sets `state`
     * and `loadedHeadSeq` to reflect the materialized result.
     * @returns {Promise<Object>} the materialized state
     */
    async asyncLoad () {
        const urls = await this.document().asyncReadUrls();
        let state = urls.poolUrl ? await SvFsJsonDocument._fetchJson(urls.poolUrl) : this.initialPool();
        if (state == null) state = this.initialPool();

        // Apply deltas in seq order (read-url already returns them sorted).
        for (const d of (urls.deltas || [])) {
            const wrapper = await SvFsJsonDocument._fetchJson(d.url);
            const delta = wrapper && "delta" in wrapper ? wrapper.delta : wrapper;
            state = this.applyDeltaFn()(state, delta);
        }

        this.setState(state);
        this.setLoadedHeadSeq(typeof urls.headSeq === "number" ? urls.headSeq : 0);
        return state;
    }

    static async _fetchJson (url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("SvFsJsonDocument fetch " + res.status + " for " + url);
        return res.json();
    }

    // ---------------------------------------------------------------- writer

    /**
     * Append a delta via an open session, AND apply it locally so
     * `state` stays current without a re-fetch.
     * @param {SvFsDocumentSession} session   open session for this document
     * @param {*} delta
     */
    async apply (session, delta) {
        if (!session || !session.isOpen()) {
            throw new Error("SvFsJsonDocument.apply: session must be open");
        }
        const next = this.applyDeltaFn()(this.state(), delta);
        await session.appendDelta(delta);
        this.setState(next);
        this.setLoadedHeadSeq(session.headSeq());
        return next;
    }

}.initThisClass());
