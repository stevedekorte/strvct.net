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

    initPrototypeSlots_textBlobs () {
        {
            /**
             * @member {WeakMap} unresolvedTextHashes - object → Map(slot name → hash)
             * of spilled text that was missing when the object loaded
             * @category Text Blobs
             */
            const slot = this.newSlot("unresolvedTextHashes", null);
            slot.setSlotType("WeakMap");
            slot.setAllowsNullValue(true);
            slot.setDescription("object → Map(slot name → hash) of spilled text missing at load: while the slot still reads \"\", a save writes the hash back rather than the blank");
        }
    }

    // --- BlobString: spilled text (Plans/Record Store §5) ---

    /**
     * @description The record entry for a BlobString slot's value, or null when
     * the value stays inline: the kept hash of text that was missing at load
     * (the slot still reads ""), or the hash of a value over the spill length.
     * @param {Object} anObject
     * @param {String} slotName
     * @param {*} value - the slot's current value
     * @returns {Object|null} { "#": hash } or null
     * @category Text Blobs
     */
    spilledEntryFor (anObject, slotName, value) {
        const kept = this.keptTextHashFor(anObject, slotName, value);
        if (kept) {
            return { "#": kept };
        }
        if (Type.isString(value) && value.length > Slot.blobStringSpillLength()) {
            return { "#": this.hashForSpilledText(value) };
        }
        return null;
    }

    /**
     * @description Names a spilled string's blob and stores the bytes: the record
     * keeps { "#": hash }. Text this store already knows (loaded, or saved
     * before) is named from the cache; only new text is hashed, synchronously
     * (the store pass is synchronous) — the blob store computes the same digest
     * of the same bytes.
     * @param {String} text
     * @returns {String} hash
     * @category Text Blobs
     */
    hashForSpilledText (text) {
        const known = this.recordStore().textHashes().get(text);
        if (known) {
            return known;
        }
        const hash = text.hexSha256Sync();
        this.recordStore().cacheTextBlob(hash, text);
        this.storeTextBlob(hash, text);
        return hash;
    }

    storeTextBlob (hash, text) {
        if (this.blobPool().isOpen()) {
            this.blobPool().asyncStoreBlob(new Blob([text], { type: "text/plain" })).catch((e) => {
                console.warn(this.logPrefix() + "could not store text blob " + hash.slice(0, 8) + ": " + (e && e.message));
            });
        }
    }

    /**
     * @description The text behind an object's { "#": hash } entry, from the
     * store's text blob cache filled at open (asyncPrefetchTextBlobsForRows).
     * A blob that never arrived reads as "", is reported, and its hash is kept
     * so a save of the object writes it back instead of the blank.
     * @param {Object} anObject
     * @param {String} slotName
     * @param {String} hash
     * @returns {String}
     * @category Text Blobs
     */
    spilledTextFor (anObject, slotName, hash) {
        const text = this.recordStore().textBlobs().get(hash);
        if (text !== undefined) {
            return text;
        }
        this.keepTextHash(anObject, slotName, hash);
        this.reportMissingTextBlob(anObject, slotName, hash);
        return "";
    }

    keepTextHash (anObject, slotName, hash) {
        if (!this.unresolvedTextHashes()) {
            this.setUnresolvedTextHashes(new WeakMap());
        }
        const map = this.unresolvedTextHashes();
        if (!map.has(anObject)) {
            map.set(anObject, new Map());
        }
        map.get(anObject).set(slotName, hash);
    }

    /**
     * @description The hash kept for a slot whose text was missing at load,
     * while the slot still reads "". Any other value is a real edit: the kept
     * hash is dropped and the value is stored as itself. (Setting "" on purpose
     * is indistinguishable from never touching it; the hash is kept then too.)
     * @category Text Blobs
     */
    keptTextHashFor (anObject, slotName, value) {
        const map = this.unresolvedTextHashes() ? this.unresolvedTextHashes().get(anObject) : undefined;
        const hash = map ? map.get(slotName) : undefined;
        if (!hash) {
            return null;
        }
        if (value === "") {
            return hash;
        }
        map.delete(slotName);
        return null;
    }

    reportMissingTextBlob (anObject, slotName, hash) {
        if (!this.shouldReportMissingPid(hash)) {
            return;
        }
        const message = "spilled text blob " + hash.slice(0, 8) + " for " + anObject.svType() + "." + slotName + " is not available: it reads as empty, and saves keep its hash";
        console.warn(this.logPrefix() + message);
        if (SvGlobals.has("SvErrorReport")) {
            SvErrorReport.asyncSend(new Error(message), { kind: "missing-text-blob", hash: hash, slotName: slotName, type: anObject.svType(), poolId: this.poolId() });
        }
    }

    /**
     * @description Loads every text blob the given rows refer to into the store's
     * cache before any record is materialized — spilled text is fetched with its
     * record, never on access. Missing blobs are fetched several at a time.
     * @param {Array} rows
     * @category Text Blobs
     */
    async asyncPrefetchTextBlobsForRows (rows) {
        const queue = Array.from(this.uncachedTextHashesIn(rows));
        const fetchNext = async () => {
            while (queue.length > 0) {
                const hash = queue.shift();
                const text = await this.asyncFetchTextBlob(hash);
                if (Type.isString(text)) {
                    this.recordStore().cacheTextBlob(hash, text);
                }
            }
        };
        const workerCount = Math.min(SvObjectPool.textBlobFetchConcurrency(), queue.length);
        await Promise.all(Array.from({ length: workerCount }, fetchNext));
        return this;
    }

    /**
     * @description True when text fetched from the cloud is the text its hash names. Wrong
     * bytes (an error page served as 200, a truncated body) are treated as a
     * missing blob — reported, and its hash kept — rather than shown as the text.
     * @param {String|null} text
     * @param {String} hash
     * @returns {Boolean}
     * @category Text Blobs
     */
    isTextForHash (text, hash) {
        if (!Type.isString(text)) {
            return false;
        }
        if (text.hexSha256Sync() === hash) {
            return true;
        }
        console.warn(this.logPrefix() + "text blob " + hash.slice(0, 8) + " came back with other content (" + text.length + " characters): treated as missing");
        return false;
    }

    static textBlobFetchConcurrency () {
        return 6;
    }

    /**
     * @description The { "#": hash } references in the rows' payloads that the
     * store's text cache does not hold yet.
     * @param {Array} rows
     * @returns {Set<String>}
     * @category Text Blobs
     */
    uncachedTextHashesIn (rows) {
        const textBlobs = this.recordStore().textBlobs();
        const hashes = new Set();
        const pattern = /"#":"([0-9a-f]{64})"/g;
        rows.forEach((row) => {
            if (!row.payloadJson) { return; }
            for (const match of row.payloadJson.matchAll(pattern)) {
                if (!textBlobs.has(match[1])) { hashes.add(match[1]); }
            }
        });
        return hashes;
    }

    /**
     * @description A spilled string's text: from the local blob store, else
     * from the cloud through the missing-text-blob fetcher — checked against its
     * hash before it is used or stored locally. Null when neither has it.
     * @param {String} hash
     * @returns {Promise<String|null>}
     * @category Text Blobs
     */
    async asyncFetchTextBlob (hash) {
        try {
            const local = await this.asyncLocalTextBlob(hash);
            if (local !== null) {
                return local;
            }
            const fetcher = SvObjectPool.missingTextBlobFetcher();
            const text = fetcher ? await fetcher(hash) : null;
            if (this.isTextForHash(text, hash)) {
                this.storeTextBlob(hash, text);
                return text;
            }
        } catch (e) {
            console.warn(this.logPrefix() + "text blob " + hash.slice(0, 8) + " fetch failed: " + (e && e.message));
        }
        return null;
    }

    async asyncLocalTextBlob (hash) {
        if (!this.blobPool().isOpen()) {
            return null;
        }
        const blob = await this.blobPool().asyncGetBlob(hash); // content-addressed: stored under its own digest
        return blob ? await blob.text() : null;
    }

    static setMissingTextBlobFetcher (fn) {
        this._missingTextBlobFetcher = fn; // async (hash) → text | null; the app installs its cloud blob path
        return this;
    }

    static missingTextBlobFetcher () {
        return this._missingTextBlobFetcher || null;
    }

}.initThisCategory());
