"use strict";

/** * @module library.node.blobs
 */

/**
 * @class SvCloudBlobNode
 * @extends SvBlobNode
 * @classdesc SvCloudBlobNode extends SvBlobNode to handle storing blobs in Google Cloud Storage.
 */

(class SvCloudBlobNode extends SvBlobNode {

    /**
     * Initializes the prototype slots for the SvBlobNode class.
     */
    initPrototypeSlots () {

        // hasInCloud- set to yes if:
        // - we downloaded it from cloud storage or
        // - successfully pushed it to cloud storage
        // NOTE:
        // - it may be in cloud even if set to false (e.g. uploaded elsewhere)
        // - it may not be in cloud even if set to true (e.g. deleted elsewhere)
        {
            const slot = this.newSlot("hasInCloud", false);
            slot.setLabel("Has In Cloud");
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
        }

        // download url (may be private or public)
        {
            const slot = this.newSlot("downloadUrl", null); // should normally call asyncDownloadUrl() to get it
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
            slot.setIsSubnodeField(true);
            slot.setDescription("Download URL of the blob");
        }

        /// push to cloud action
        {
            const slot = this.newSlot("pushToCloudAction", null);
            slot.setLabel("Push to Cloud");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncPushToCloud");
        }

        // so multiple calls to push to cloud don't result in multiple promises
        {
            const slot = this.newSlot("pushToCloudPromise", null);
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Promise");
            slot.setIsSubnodeField(false);
        }

        /// pull from cloud action
        {
            const slot = this.newSlot("pullFromCloudAction", null);
            slot.setLabel("Pull from Cloud");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncForcePullFromCloudByHash");
        }

        // auto-sync to cloud after local storage
        {
            const slot = this.newSlot("doesAutoSyncToCloud", false);
            slot.setLabel("Auto Sync to Cloud");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
        }
    }

    /**
     * Initializes the prototype for the SvBlobNode class.
     */
    /**
     * @description Whether this node points at content — a blob hash we can
     * fetch, or a public URL. An empty string is NOT a reference: an AI patch
     * creating an artwork item lands here with valueHash "" / publicUrl "",
     * and every "generate missing artwork" path once skipped those items as
     * already illustrated (20 locations with prompts and no pictures, 2026-09-14).
     * @returns {Boolean}
     * @category Blob Content
     */
    hasContentReference () {
        const present = (v) => typeof v === "string" && v.length > 0;
        return present(this.valueHash()) || present(this.publicUrl());
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
    }

    clear () {
        super.clear();
        this.setHasInCloud(false);
        this.setDownloadUrl(null);
        return this;
    }

    hasPublicUrl () {
        return this.downloadUrl() !== null;
    }

    hasBlobValue () {
        return this.blobValue() !== null;
    }

    /**
     * @description Checks if the blob is available without downloading it.
     * Checks in-memory, local IndexedDB, and cloud storage existence.
     * @returns {Promise<boolean>}
     * @category Availability
     */
    async asyncHasBlob () {
        if (this.blobValue()) {
            return true;
        }

        const hash = this.valueHash();
        if (!hash) {
            return false;
        }

        // Check local blob pool (in-memory cache + IndexedDB, no download)
        const hasLocal = await this.defaultStore().blobPool().asyncHasBlob(hash);
        if (hasLocal) {
            return true;
        }

        // Check cloud storage existence (metadata only, no download)
        try {
            const file = await SvApp.shared().cloudStorageService().asyncPublicFileForHash(hash);
            return await file.asyncDoesExist();
        } catch {
            return false;
        }
    }

    // --- auto-sync to cloud ---

    /**
     * @description Replaces the bytes and uploads them, resetting the cloud
     * bookkeeping FIRST.
     *
     * The reset cannot be left to didUpdateSlotValueHash: that hook fires only
     * when the old and new hash are both non-null, and this method moves the hash
     * old -> null -> new (the base nulls it so a true hash is recomputed instead
     * of the stale cache being returned). Neither transition satisfies the guard,
     * so on a REPLACED blob hasInCloud stayed true from the previous content and
     * schedulePushToCloud() returned early — the new bytes were not uploaded here.
     * They still reached the cloud eventually, because asyncPublicUrl() pushes
     * when it finds no cloud copy and a local blob, but only when something later
     * asked for a URL. That lateness is half of "the host sees the new character
     * image and the client does not".
     *
     * Safe to do here because reaching this method MEANS the bytes changed:
     * asyncSetBlobValue compares hashes and only delegates here on a mismatch.
     * @param {Blob} blob
     * @returns {SvCloudBlobNode}
     * @category Cloud Storage
     */
    async asyncJustSetBlobValue (blob) { // private method, don't call directly, use asyncSetBlobValue instead
        this.setHasInCloud(false); // the old content's cloud state does not describe these bytes
        this.setDownloadUrl(null); // nor does its URL
        this.clearPushToCloudPromise(); // abandon any in-flight push of the old bytes
        await super.asyncJustSetBlobValue(blob);
        if (this.doesAutoSyncToCloud()) {
            this.schedulePushToCloud();
        }
        return this;
    }

    schedulePushToCloud () {
        if (this.pushToCloudPromise() || this.hasInCloud()) {
            return;
        }
        SvSyncScheduler.shared().scheduleTargetAndMethod(this, "onScheduledPushToCloud");
    }

    onScheduledPushToCloud () {
        this.asyncPushToCloud();
    }

    // --- push to cloud ---

    async asyncPushToCloud () {
        if (this.pushToCloudPromise()) {
            return this.pushToCloudPromise();
        }
        const blob = this.blobValue();
        if (!blob) {
            throw new Error(this.logPrefix() + " asyncPushToCloud: no blob value to push");
        }
        // Hold the promise LOCALLY. While the upload is in flight the content
        // can be replaced (asyncJustSetBlobValue / didUpdateSlotValueHash
        // clear the slot to abandon this push), and reading the slot back
        // after the await then dereferenced null — "Cannot read properties
        // of null (reading 'callRejectFunc')" on dev 2026-09-13, a regenerated
        // image landing mid-upload. Settle the promise we made; only clear the
        // slot if it is still ours (a newer push may have taken it).
        const promise = Promise.clone();
        this.setPushToCloudPromise(promise);
        try {
            const publicUrl = await SvApp.shared().asyncPublicUrlForBlob(blob);
            if (this.pushToCloudPromise() === promise) {
                // Only the push that is still current may describe the cloud
                // state; an abandoned one uploaded bytes that are no longer ours.
                this.setDownloadUrl(publicUrl);
                this.setHasInCloud(true);
                this.clearPushToCloudPromise();
            }
            promise.callResolveFunc();
            return publicUrl;
        } catch (error) {
            if (this.pushToCloudPromise() === promise) {
                this.clearPushToCloudPromise();
            }
            promise.callRejectFunc(error);
            throw error;
        }
    }

    clearPushToCloudPromise () {
        this.setPushToCloudPromise(null);
        return this;
    }

    pushToCloudActionInfo () {
        return {
            title: "Push to Cloud",
            isEnabled: this.hasBlobValue(),
            subtitle: this.hasBlobValue() ? null : "No blob value"
        };
    }

    // --- public url ---

    isLocalhostUrl (url) {
        if (!url) {
            return false;
        }
        try {
            const hostname = new URL(url).hostname;
            return hostname === "localhost" || hostname === "127.0.0.1";
        } catch {
            return false;
        }
    }

    async asyncPublicUrl () {
        const cachedUrl = this.publicUrl();
        if (cachedUrl && !this.isLocalhostUrl(cachedUrl)) {
            return cachedUrl;
        }

        // Clear stale localhost URLs
        if (cachedUrl) {
            this.setPublicUrl(null);
        }

        const hash = await this.asyncValueHash();
        if (!hash) {
            throw new Error(this.logPrefix() + " asyncPublicUrl(): no valueHash — blob may not have been stored");
        }

        if (this.hasInCloud()) {
            try {
                const url = await SvApp.shared().cloudStorageService().asyncPublicUrlForHash(hash);
                if (!this.isLocalhostUrl(url)) {
                    this.setPublicUrl(url);
                    return url;
                }
                // Got a localhost URL from cloud service — clear flag and re-upload
                console.warn(this.logPrefix() + " cloud returned localhost URL, will re-upload");
                this.setHasInCloud(false);
            } catch (error) {
                if (error.code === "storage/object-not-found") {
                    console.warn(this.logPrefix() + " cloud object not found, clearing hasInCloud flag");
                    this.setHasInCloud(false);
                } else {
                    throw error;
                }
            }
        }

        if (!this.hasBlobValue()) {
            throw new Error("Not Found");
        }

        await this.asyncPushToCloud();
        let url = this.downloadUrl();

        // If push returned a localhost URL, get the public URL via the storage service
        // (which may be overridden in local dev to use the correct GCS bucket)
        if (this.isLocalhostUrl(url)) {
            console.warn(this.logPrefix() + " asyncPushToCloud returned localhost URL, resolving via storage service");
            url = await SvApp.shared().cloudStorageService().asyncPublicUrlForHash(hash);
        }

        this.setPublicUrl(url);
        return url;
    }

    // --- pull from cloud ---

    // Session-scoped map of content hash → timestamp of the last definitive
    // miss (404 / object-not-found). Re-fetching a missing blob on every
    // render floods the network + console and can stall callers (e.g. a
    // generateImage tool call) on retry-limit-exceeded — which can hang the
    // AI response waiting on that blocking tool call.
    //
    // But "missing" is NOT always permanent: in multiplayer the host uploads
    // a finished image's blob moments after (or seconds before) the envelope
    // referencing it reaches guests, and a guest that pulls inside that
    // window gets a definitive 404 for a blob that exists shortly after.
    // A permanent cache turned that race into "images never render for
    // clients". So misses expire after a TTL: the flood becomes at most one
    // probe per TTL per hash, and late-arriving blobs heal on their own.
    // Transient failures (network / retry-limit / status 0) are never cached.
    static missingHashTtlMs () {
        return 60000;
    }

    static missingHashes () {
        if (!this._missingHashes) { this._missingHashes = new Map(); } // hash → last-miss ms timestamp
        return this._missingHashes;
    }

    static hashIsMarkedMissing (hash) {
        const missedAt = this.missingHashes().get(hash);
        if (missedAt === undefined) { return false; }
        if (Date.now() - missedAt > this.missingHashTtlMs()) {
            this.missingHashes().delete(hash); // expired — retryable again
            return false;
        }
        return true;
    }

    /**
     * @description Clears BOTH negative caches for a hash: this class's static
     * missing-hash map AND the cloud storage service's own independent one. A
     * stale entry in EITHER silently blocks a pull (the service's returns null
     * without throwing, so upstream sees "no blob" rather than "missing"), so
     * clearing one alone is not enough. Call this when something PROVES the
     * blob should now be fetchable — an envelope naming the hash arrives, or a
     * stalled fetch escalates.
     * @param {String} hash - The hex sha256 content hash.
     * @returns {SvCloudBlobNode} The class.
     * @category Blob Storage
     */
    static forgetMissingHash (hash) {
        if (!hash) { return this; }
        this.missingHashes().delete(hash);
        try {
            const service = SvApp.shared().cloudStorageService();
            if (service && service.forgetMissingBlobHash) {
                service.forgetMissingBlobHash(hash);
            }
        } catch {
            // No cloud storage service in this context (headless, pre-boot);
            // the static map above is cleared either way.
        }
        return this;
    }

    errorIsDefinitiveNotFound (error) {
        if (!error) { return false; }
        const code = error.code || "";
        if (code === "storage/object-not-found") { return true; }
        if (code === "storage/retry-limit-exceeded" || code === "storage/canceled") { return false; }
        const msg = (error.message || "").toLowerCase();
        // Transient — keep retryable.
        if (/retry-limit|network|timed out|timeout|aborted|status: 0|request failed/.test(msg)) { return false; }
        // Definitive — won't resolve by retrying.
        if (/object-not-found|not found|\b404\b|\b403\b/.test(msg)) { return true; }
        return false; // unknown → treat as transient (safer to allow retry)
    }

    async asyncForcePullFromCloudByHash () {
        return this.asyncPullFromCloudByHash(true);
    }

    async asyncPullFromCloudByHash (forceRetry = false) {
        if (this.blobValue()) {
            return this.blobValue();
        }
        const hash = this.valueHash();
        if (!hash) {
            return null; // no hash to pull from cloud
        }
        // Skip a hash that missed recently (unless the caller forces it).
        if (!forceRetry && SvCloudBlobNode.hashIsMarkedMissing(hash)) {
            return null;
        }
        try {
            // Forward `force` so a forced pull also bypasses the cloud storage
            // service's own (independent, silent) negative cache — otherwise a
            // forced retry short-circuits there and looks like a clean miss.
            const blob = await SvApp.shared().asyncBlobForHash(hash, { force: forceRetry });
            if (blob) {
                this.setBlobValue(blob);
                this.setHasInCloud(true);
                SvCloudBlobNode.missingHashes().delete(hash); // it exists after all
            }
            return this.blobValue();
        } catch (error) {
            if (this.errorIsDefinitiveNotFound(error)) {
                if (!SvCloudBlobNode.missingHashes().has(hash)) {
                    console.warn("SvCloudBlobNode: blob not in cloud (won't re-fetch for " + (SvCloudBlobNode.missingHashTtlMs() / 1000) + "s unless forced) hash: " + hash.slice(0, 12) + "...");
                }
                SvCloudBlobNode.missingHashes().set(hash, Date.now());
            } else {
                console.warn("SvCloudBlobNode: transient failure pulling blob (will retry) hash: " + hash.slice(0, 12) + "...:", error.message);
            }
            return null;
        }
    }

    async asyncPullFromCloudByDownloadUrl () {
        const downloadUrl = this.downloadUrl();
        assert(downloadUrl, "Download URL is required");
        const blob = await SvApp.shared().cloudStorageService().asyncBlobForDownloadUrl(downloadUrl);
        this.setBlobValue(blob);
        this.setHasInCloud(true); // it's now in cloud storage
        return this.blobValue();
    }

    pullFromCloudActionInfo () {
        return {
            title: "Pull from Cloud",
            isEnabled: this.hasValueHash(),
            subtitle: this.hasValueHash() ? null : "No value hash"
        };
    }

    /**
     * @description Extends the base hook (which clears the stale cached blob on
     * a non-null → different-non-null hash transition) to also reset the cloud
     * bookkeeping that described the OLD content. Without this, a reused node
     * keeps hasInCloud === true and a stale downloadUrl for the new hash, so
     * schedulePushToCloud() would skip uploading the new bytes and asyncPublicUrl()
     * would hand back a URL for the old content. Any in-flight push for the old
     * bytes is abandoned. Uses the same both-non-null-and-different guard as the
     * base, so asyncJustSetBlobValue()'s null-on-one-side sequence is untouched.
     * @param {?string} oldValue - The previous hash (null if none).
     * @param {?string} newValue - The new hash (null if cleared).
     * @category Cloud Storage
     */
    didUpdateSlotValueHash (oldValue, newValue) {
        super.didUpdateSlotValueHash(oldValue, newValue);
        if (newValue === null || newValue === oldValue) {
            return;
        }
        if (oldValue !== null) {
            // REPLACING content: the previous hash's cloud state and URL
            // describe bytes this node no longer claims.
            this.setHasInCloud(false);
            this.setDownloadUrl(null);
            this.clearPushToCloudPromise(); // abandon any in-flight push of the old bytes
        }
        this.scheduleFetchForNewContent();
    }

    /**
     * @description After the content identity changes, go and GET the new bytes
     * instead of waiting for something to ask for them.
     *
     * The clears above are correct but they only invalidate — they leave the node
     * holding a hash and nothing else. On the machine that AUTHORED the new
     * content that is harmless, because it still has the blob (its hash moves
     * old -> null -> new, which this both-non-null guard skips, so its blobValue
     * survives). On a machine RECEIVING the change over cloud json the hash moves
     * old -> new directly: the base hook drops the now-stale cached bytes, and
     * nothing replaces them until a view happens to ask. Views ask when they
     * initialize, which is why a regenerated character portrait appeared on the
     * host immediately and on the client only after a reload.
     *
     * asyncBlobValue(), not asyncPublicUrl(): the URL path requires either
     * hasInCloud (just cleared) or a local blob to push, and would throw "Not
     * Found" on the receiving side. The blob path pulls from the cloud BY HASH,
     * which is exactly what a receiver needs. blobValue syncsToView, so the view
     * repaints when the bytes land.
     *
     * FIRST content counts too (2026-09-10). This used to be reached only when
     * one hash REPLACED another, on the theory that the authoring side is the
     * one whose hash moves old -> null -> new. But so does a receiver seeing
     * content for the first time: a newly generated portrait arrives as a whole
     * new artwork item whose imageNode goes null -> hash, and that was silently
     * excluded — the client held a hash and no bytes, and nothing fetched them.
     * Every hash change to a non-null value now schedules; the authoring side is
     * excluded by onScheduledFetchForNewContent's blobValue check instead, which
     * is the accurate test (it asks "do I have the bytes?" rather than inferring
     * it from the shape of the transition).
     * @category Cloud Storage
     */
    scheduleFetchForNewContent () {
        if (!SvCloudBlobNode.fetchesNewContentEagerly()) {
            return; // a process with no views (a headless session host) pulls bytes on demand only
        }
        // No blobValue check HERE: when one hash replaces another, super's hook
        // has already dropped the cached bytes, but on a first-content set the
        // author still holds them. Deciding at run time covers both — see
        // onScheduledFetchForNewContent.
        SvSyncScheduler.shared().scheduleTargetAndMethod(this, "onScheduledFetchForNewContent");
    }

    /**
     * @static
     * @description Whether a hash change schedules a pull of the new bytes
     * (see scheduleFetchForNewContent). On by default: the pull exists so a
     * VIEW shows content that arrived over the cloud without waiting to be
     * asked. A process that never renders pixels (a headless session host)
     * turns it off — otherwise loading a session and the catalog pulls every
     * image they reference, and those pulls crowd out the requests it does
     * need (Server-Hosted Sessions M0). asyncBlobValue() still pulls on demand.
     * @param {Boolean} aBool
     * @returns {Function} the class
     * @category Cloud Storage
     */
    static setFetchesNewContentEagerly (aBool) {
        this._fetchesNewContentEagerly = aBool;
        return this;
    }

    static fetchesNewContentEagerly () {
        return this._fetchesNewContentEagerly !== false;
    }

    onScheduledFetchForNewContent () {
        if (this.blobValue()) {
            // Either something supplied the bytes between the schedule and now,
            // or this IS the authoring side (asyncJustSetBlobValue sets the blob
            // before it computes the hash, so the bytes are already in hand).
            return;
        }
        // fire and forget: a miss is already logged by the pull path, and a
        // failure here must not break whatever applied the update
        this.asyncBlobValue().catch(error => {
            console.warn(this.logPrefix() + " fetch after content change failed: " + (error.message || error));
        });
    }

    /**
     * @description The blob bytes for this node, looked up through the full
     * chain: in-memory value → local blob pool → cloud pull by hash.
     * @param {Object} [options] - Lookup options.
     * @param {Boolean} [options.force] - Bypass the negative caches (this
     * class's static missing-hash map and the storage service's own) and
     * re-probe the cloud. For a caller that KNOWS the hash should be fetchable.
     * @returns {Promise<Blob|null>} The blob, or null when unavailable.
     * @category Blob Storage
     */
    warnOnceAboutMalformedHash (hash) {
        const seen = SvCloudBlobNode.malformedHashesWarned();
        if (!seen.has(hash)) {
            seen.add(hash);
            console.warn(this.logPrefix ? this.logPrefix() : "[SvCloudBlobNode]", "malformed blob hash treated as no image:", JSON.stringify(hash));
        }
        return this;
    }

    static malformedHashesWarned () {
        if (!this._malformedHashesWarned) {
            this._malformedHashesWarned = new Set();
        }
        return this._malformedHashesWarned;
    }

    async asyncBlobValue (options = {}) {
        const forceRetry = options.force === true;
        const blob = await this.blobValue();
        if (blob) {
            return blob;
        }

        const hash = this.valueHash();
        if (hash) {
            if (!/^[0-9a-f]{64}$/.test(hash)) {
                // Data, not a caller bug: a placeholder hash ("pending") saved by
                // an authoring script that never finished. Treat it as no image —
                // an assert here failed three times per catalog sync (2026-09-22).
                this.warnOnceAboutMalformedHash(hash);
                return null;
            }

            // A hash already confirmed missing won't be on local disk or in the
            // cloud — short-circuit so a re-render doesn't re-run the lookup chain.
            if (!forceRetry && SvCloudBlobNode.missingHashes().has(hash)) {
                return null;
            }

            const localBlob = await this.asyncReadFromLocalStorage();
            if (localBlob) {
                return localBlob;
            }

            const cloudBlob = await this.asyncPullFromCloudByHash(forceRetry);
            if (cloudBlob) {
                return cloudBlob;
            }
            // asyncPullFromCloudByHash logs once when it confirms a miss; only
            // warn here for the not-yet-classified (e.g. transient) case.
            if (!SvCloudBlobNode.missingHashes().has(hash)) {
                console.warn(this.logPrefix() + " asyncBlobValue: blob not found anywhere for " + hash.substring(0, 12) + "...");
            }
        }

        return null;
    }

}.initThisClass());

