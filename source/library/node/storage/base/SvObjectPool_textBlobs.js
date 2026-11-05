"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool_textBlobs
 * @extends SvObjectPool
 * @classdesc Spilled text (BlobString, Plans/Record Store §5): naming a spilled string's
 * blob, storing its bytes, and fetching them back — prefetched for a window of
 * rows, or from the cloud when the local blob is missing. A category of
 * SvObjectPool, split from SvObjectPool.js unchanged (Plans/Cleanup § 3).
 */
(class SvObjectPool_textBlobs extends SvObjectPool {

    // --- BlobString: spilled text (Plans/Record Store §5) ---

    /**
     * @description Names a spilled string's blob and stores the bytes: the record
     * keeps { "#": hash }. The hash is computed synchronously (the store pass is
     * synchronous); the blob store computes the same digest of the same bytes.
     * @category Text Blobs
     */
    hashForSpilledText (text) {
        const hash = text.hexSha256Sync();
        const store = this.recordStore();
        if (!store.textBlobs().has(hash)) {
            store.textBlobs().set(hash, text);
            if (this.blobPool().isOpen()) {
                this.blobPool().asyncStoreBlob(new Blob([text], { type: "text/plain" })).catch((e) => {
                    console.warn(this.logPrefix() + "could not store text blob " + hash.slice(0, 8) + ": " + (e && e.message));
                });
            }
        }
        return hash;
    }

    /**
     * @description The text behind a { "#": hash } entry, from the store's text
     * blob cache filled at open (asyncPrefetchTextBlobs); a blob that never
     * arrived reads as an empty string (logged once).
     * @category Text Blobs
     */
    textForSpilledHash (hash) {
        const text = this.recordStore().textBlobs().get(hash);
        if (text === undefined) {
            if (this.shouldReportMissingPid(hash)) {
                console.warn(this.logPrefix() + "spilled text blob " + hash.slice(0, 8) + " is not available — reading it as empty");
            }
            return "";
        }
        return text;
    }

    /**
     * @description Loads every text blob the given rows refer to into the store's
     * cache before any record is materialized — spilled text is fetched with its
     * record, never on access. Blobs missing locally are asked of the missing-
     * text-blob fetcher (the app's cloud blob path) when one is installed.
     * @param {Array} rows
     * @category Text Blobs
     */
    async asyncPrefetchTextBlobsForRows (rows) {
        const store = this.recordStore();
        const hashes = new Set();
        const pattern = /"#":"([0-9a-f]{64})"/g;
        rows.forEach((row) => {
            if (!row.payloadJson) { return; }
            let match;
            while ((match = pattern.exec(row.payloadJson)) !== null) {
                if (!store.textBlobs().has(match[1])) { hashes.add(match[1]); }
            }
        });
        for (const hash of hashes) {
            const text = await this.asyncFetchTextBlob(hash);
            if (Type.isString(text)) {
                store.textBlobs().set(hash, text);
            }
        }
        return this;
    }

    async asyncFetchTextBlob (hash) {
        try {
            if (this.blobPool().isOpen()) {
                const blob = await this.blobPool().asyncGetBlob(hash);
                if (blob) { return await blob.text(); }
            }
            const fetcher = SvObjectPool.missingTextBlobFetcher();
            if (fetcher) {
                const text = await fetcher(hash);
                if (Type.isString(text) && this.blobPool().isOpen()) {
                    this.blobPool().asyncStoreBlob(new Blob([text], { type: "text/plain" })).catch(() => {});
                }
                return text;
            }
        } catch (e) {
            console.warn(this.logPrefix() + "text blob " + hash.slice(0, 8) + " fetch failed: " + (e && e.message));
        }
        return null;
    }

    static setMissingTextBlobFetcher (fn) {
        this._missingTextBlobFetcher = fn; // async (hash) → text | null; the app installs its cloud blob path
        return this;
    }

    static missingTextBlobFetcher () {
        return this._missingTextBlobFetcher || null;
    }

}.initThisCategory());
