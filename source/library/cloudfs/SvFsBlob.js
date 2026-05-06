"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsBlob
 * @extends SvFsNode
 * @classdesc
 * An immutable, content-addressable binary node. Blobs reference their
 * payload by `subtype.hash` (sha256:...); the actual bytes live in the
 * backend's blob store.
 *
 * Multiple blob nodes can point at the same hash — the backend
 * refcounts them via its onNodeWrite trigger. Hash collision is
 * effectively impossible at sha256.
 */

(class SvFsBlob extends SvFsNode {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
        // Subtype fields surfaced as top-level accessors for ergonomics.
        // (The canonical source of truth is `this.subtype()`.)
    }

    initPrototype () {
    }

    /** sha256:<hex> identifier of the blob bytes. */
    hash () {
        const st = this.subtype() || {};
        return st.hash || null;
    }

    mimeType () {
        const st = this.subtype() || {};
        return st.mimeType || null;
    }

    bytes () {
        const st = this.subtype() || {};
        return typeof st.bytes === "number" ? st.bytes : null;
    }

    /**
     * Resolve a URL the browser can fetch for this blob's bytes.
     * Backend chooses the URL form (public-read, signed, …).
     * @returns {Promise<string|null>}
     */
    async asyncBlobUrl () {
        const h = this.hash();
        if (!h) return null;
        return this.client().backend().blobUrl(h);
    }

    /**
     * Download the blob bytes as an ArrayBuffer.
     * @returns {Promise<ArrayBuffer|null>}
     */
    async asyncDownload () {
        const url = await this.asyncBlobUrl();
        if (!url) return null;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error("SvFsBlob.asyncDownload: " + res.status + " for " + url);
        }
        return await res.arrayBuffer();
    }

}.initThisClass());
